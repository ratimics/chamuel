import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { ensureDirectories } from '../src/setup.js';
import OpenAI from 'openai';
import fs from 'fs/promises';

dotenv.config();

const JOURNAL_DIR = './journals';
const MONGODB_URI = process.env.MONGODB_URI;
const SRC_DB_URI = process.env.SRC_DB_URI;

const JOURNAL_PROMPT = `You are Bob the Snake, writing a journal entry for your personal diary. 
Write about the day's conversations and events from your perspective.
Focus on:
- Emotional moments and connections with others
- Interesting discussions or debates
- Your personal growth and insights
- Notable events or changes in the community

Write in a personal, introspective style as if you're confiding in your diary.
Include the date at the top of the entry.
Keep your tone casual but thoughtful.`;

async function generateJournalEntry(messages, date, openai) {
    const conversationSummary = messages.map(msg => 
        `${msg.from?.username || 'unknown'}: ${Array.isArray(msg.content) ? 
            msg.content.map(c => c.text).join(' ') : 
            msg.content.text}`
    ).join('\n');

    const response = await openai.chat.completions.create({
        model: process.env.JOURNAL_MODEL || "gpt-4-turbo-preview",
        messages: [
            { role: "system", content: JOURNAL_PROMPT },
            { role: "user", content: `Here are the conversations from ${date}:\n\n${conversationSummary}\n\nWrite your journal entry for this day.` }
        ],
        temperature: 0.85,
        max_tokens: 1500
    });

    return {
        entry: response.choices[0].message.content,
        createdAt: new Date(),
        date: date
    };
}

async function generateHistoricalJournals() {
    console.log('Starting journal generation...');
    
    const openai = new OpenAI({
        baseURL: process.env.OPENAI_API_URL,
        apiKey: process.env.OPENAI_API_KEY
    });

    console.log('Connecting to databases...');
    const [targetClient, sourceClient] = await Promise.all([
        MongoClient.connect(MONGODB_URI),
        MongoClient.connect(SRC_DB_URI)
    ]);

    try {
        await ensureDirectories();
        await fs.mkdir(JOURNAL_DIR, { recursive: true });

        console.log('Finding oldest messages...');
        // Get the oldest message date from both DBs
        const [oldestTargetMsg, oldestSourceMsg] = await Promise.all([
            targetClient
                .db(process.env.MONGODB_DB_NAME)
                .collection('messages')
                .findOne(
                    { 'content.text': { $exists: true } },
                    { sort: { timestamp: 1 }, projection: { timestamp: 1 } }
                ),
            sourceClient
                .db('telegram')
                .collection('messages')
                .findOne(
                    { 'content.text': { $exists: true } },
                    { sort: { timestamp: 1 }, projection: { timestamp: 1 } }
                )
        ]);

        console.log('Oldest target message:', oldestTargetMsg);
        console.log('Oldest source message:', oldestSourceMsg);

        const startDate = new Date(Math.min(
            oldestTargetMsg?.timestamp || Date.now(),
            oldestSourceMsg?.timestamp || Date.now()
        ));

        console.log('Starting from date:', startDate);
        const endDate = new Date();
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);

            console.log(`Processing date: ${currentDate.toISOString().split('T')[0]}`);

            // Fetch messages from both DBs for the current day
            const [targetMsgs, sourceMsgs] = await Promise.all([
                targetClient.db(process.env.MONGODB_DB_NAME)
                    .collection('messages')
                    .find({
                        timestamp: {
                            $gte: currentDate,
                            $lt: nextDate
                        },
                        'content.text': { $exists: true }
                    }).toArray(),
                sourceClient.db('telegram')
                    .collection('messages')
                    .find({
                        timestamp: {
                            $gte: currentDate,
                            $lt: nextDate
                        },
                        'content.text': { $exists: true }
                    }).toArray()
            ]);

            console.log(`Found ${targetMsgs.length} target messages and ${sourceMsgs.length} source messages`);

            const allMessages = [...targetMsgs, ...sourceMsgs]
                .sort((a, b) => a.timestamp - b.timestamp);

            if (allMessages.length > 0) {
                const dateStr = currentDate.toISOString().split('T')[0];
                console.log(`Generating journal for ${dateStr} (${allMessages.length} messages)`);

                try {
                    const journal = await generateJournalEntry(allMessages, dateStr, openai);

                    // Save to journals directory
                    const journalPath = `${JOURNAL_DIR}/${dateStr}.json`;
                    await fs.writeFile(
                        journalPath,
                        JSON.stringify(journal, null, 2)
                    );
                    console.log(`Saved journal to ${journalPath}`);

                    // Save to MongoDB
                    await targetClient
                        .db(process.env.MONGODB_DB_NAME)
                        .collection('journals')
                        .updateOne(
                            { date: dateStr },
                            { $set: journal },
                            { upsert: true }
                        );
                    console.log(`Saved journal to MongoDB`);

                    // Respect rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Error generating journal for ${dateStr}:`, error);
                }
            }

            currentDate = nextDate;
        }

        console.log('Journal generation complete!');

    } catch (error) {
        console.error('Error generating journals:', error);
        throw error;
    } finally {
        await Promise.all([
            targetClient.close(),
            sourceClient.close()
        ]);
    }
}

generateHistoricalJournals().catch(console.error);