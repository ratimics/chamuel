import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { ensureDirectories } from '../src/setup.js';
import fs from 'fs/promises';

dotenv.config();
const MEMORY_SUMMARY_PROMPT = `You are Chamuel, the nerdy angel, updating your memories with recent experiences.`;
const WEEKLY_MEMORIES_DIR = './weekly_memories';
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

async function fetchDataForTimeRange(clients, startDate, endDate) {
    const { botClient, bobXClient } = clients;

    // Fetch discord messages
    const messages = await botClient
        .db('botDB')
        .collection('messages')
        .find({
            createdAt: { $gte: startDate, $lt: endDate }
        })
        .sort({ createdAt: 1 })
        .toArray();

    // Fetch journal entries
    const journals = await botClient
        .db('botDB')
        .collection('journalEntries')
        .find({
            createdAt: { $gte: startDate, $lt: endDate }
        })
        .sort({ createdAt: 1 })
        .toArray();

    // Fetch tweets
    const tweets = await bobXClient
        .db('bobX')
        .collection('tweets')
        .find({
            // Convert tweet id to timestamp
            id: {
                $gte: snowflakeToTimestamp(startDate),
                $lt: snowflakeToTimestamp(endDate)
            }
        })
        .toArray();

    // Format all data into a consistent structure
    const formattedMessages = [
        ...messages.map(msg => ({
            timestamp: new Date(msg.createdAt),
            username: msg.authorUsername,
            content: [{ type: 'text', text: msg.content }],
            source: 'discord'
        })),
        ...journals.map(journal => ({
            timestamp: new Date(journal.createdAt),
            username: 'BobJournal',
            content: [{ type: 'text', text: journal.content }],
            source: 'journal'
        })),
        ...tweets.map(tweet => ({
            timestamp: new Date(twitterIdToTimestamp(tweet.id)),
            username: 'chamue1337',
            content: [{ type: 'text', text: tweet.text }],
            source: 'twitter'
        }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    return formattedMessages;
}

async function generateWeeklyMemories() {
    console.log('Starting weekly memory generation...');

    const openai = new OpenAI({
        baseURL: process.env.OPENAI_API_URL,
        apiKey: process.env.OPENAI_API_KEY,
        defaultHeaders: {
            "HTTP-Referer": process.env.YOUR_SITE_URL,
            "X-Title": process.env.YOUR_SITE_NAME
        }
    });

    const [targetClient, sourceClient] = await Promise.all([
        MongoClient.connect(process.env.SRC_DB_URI),
        MongoClient.connect(process.env.MONGODB_URI)
    ]);

    // Pass OpenAI client to functions that need it
    async function processWeeklyMemory(messages, prevMemory) {
        const combinedMessages = messages.map(m => 
            `${m.username}: ${m.content.map(c => c.text).join(' ')}`
        ).join('\n');

        const response = await openai.chat.completions.create({
            model: process.env.MEMORY_MODEL || "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: MEMORY_SUMMARY_PROMPT },
                { role: "assistant", content: `My previous memories: ${prevMemory}` },
                { role: "user", content: `Here are my recent conversations:\n${combinedMessages}\n\nUpdate my memories to include these new experiences.` }
            ],
            temperature: 0.8,
        });

        return response.choices[0].message.content;
    }

    try {
        await ensureDirectories();
        await fs.mkdir(WEEKLY_MEMORIES_DIR, { recursive: true });
        
        await Promise.all([targetClient.connect(), sourceClient.connect()]);

        // Find earliest message date
        const oldestMessage = await targetClient
            .db('botDB')
            .collection('messages')
            .findOne({}, { sort: { createdAt: 1 } });

        if (!oldestMessage) {
            console.log('No messages found');
            return;
        }

        const startDate = new Date(oldestMessage.createdAt);
        const endDate = new Date();
        let currentDate = new Date(startDate);
        let previousMemory = '';

        console.log(`Starting from ${startDate.toISOString()}`);

        while (currentDate < endDate) {
            const weekEnd = new Date(currentDate.getTime() + ONE_WEEK);
            
            console.log(`Processing week: ${currentDate.toISOString()} to ${weekEnd.toISOString()}`);

            const messages = await fetchDataForTimeRange(
                { botClient: targetClient, bobXClient: sourceClient },
                currentDate,
                weekEnd
            );

            if (messages.length > 0) {
                const weeklyMemory = await processWeeklyMemory(messages, previousMemory);
                previousMemory = weeklyMemory;

                const fileName = `${WEEKLY_MEMORIES_DIR}/memory-${currentDate.toISOString().split('T')[0]}.md`;
                await fs.writeFile(fileName, 
                    `# Weekly Memory: ${currentDate.toISOString().split('T')[0]}\n\n${weeklyMemory}`
                );

                console.log(`Generated memory for week of ${currentDate.toISOString().split('T')[0]} (${messages.length} items)`);
            }

            currentDate = weekEnd;
        }

    } catch (error) {
        console.error('Error generating weekly memories:', error);
        throw error;
    } finally {
        await Promise.all([
            targetClient.close(),
            sourceClient.close()
        ]);
    }
}

// Utility functions for timestamp conversions
function snowflakeToTimestamp(date) {
    return ((date.getTime() - 1420070400000) * Math.pow(2, 22)).toString();
}

function twitterIdToTimestamp(id) {
    return Number(BigInt(id) >> 22n) + 1288834974657;
}

generateWeeklyMemories().catch(console.error);