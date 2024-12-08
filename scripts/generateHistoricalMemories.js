
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { updateMemory } from '../src/services/memory/memoryService.js';
import { ensureDirectories } from '../src/setup.js';

dotenv.config();

const BATCH_SIZE = 100;
const TARGET_DB_URI = process.env.MONGODB_URI;
const SOURCE_DB_URI = process.env.SRC_DB_URI;

async function fetchMessagesFromDb(client, dbName, startDate) {
    const db = client.db(dbName);
    return await db.collection('messages')
        .find({
            timestamp: { $gte: startDate },
            'content.text': { $exists: true }
        })
        .sort({ timestamp: 1 })
        .toArray();
}

async function processBatch(messages) {
    const formattedMessages = messages.map(msg => ({
        username: msg.from?.username || 'unknown',
        content: Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content.text }],
        timestamp: msg.timestamp
    }));

    await updateMemory(formattedMessages);
}

async function generateHistoricalMemories() {
    const targetClient = new MongoClient(TARGET_DB_URI);
    const sourceClient = new MongoClient(SOURCE_DB_URI);

    try {
        await ensureDirectories();
        await targetClient.connect();
        await sourceClient.connect();

        // Calculate start date (e.g., 7 days ago)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(process.env.MEMORY_WINDOW_DAYS || 7));

        // Fetch messages from both databases
        const targetMessages = await fetchMessagesFromDb(
            targetClient, 
            process.env.MONGODB_DB_NAME,
            startDate
        );
        const sourceMessages = await fetchMessagesFromDb(
            sourceClient,
            'telegram',
            startDate
        );

        // Combine and sort messages
        const allMessages = [...targetMessages, ...sourceMessages]
            .sort((a, b) => a.timestamp - b.timestamp);

        // Process in batches
        for (let i = 0; i < allMessages.length; i += BATCH_SIZE) {
            const batch = allMessages.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(allMessages.length / BATCH_SIZE)}`);
            await processBatch(batch);
        }

        console.log('Memory generation complete!');

    } catch (error) {
        console.error('Error generating memories:', error);
    } finally {
        await targetClient.close();
        await sourceClient.close();
    }
}

// Run the script
generateHistoricalMemories().catch(console.error);