import { CONFIG } from '../../config/index.js';
import fs from 'fs/promises';
import OpenAI from 'openai';

const MEMORY_FILE = './memory.md';
const MEMORY_SUMMARY_PROMPT = `You are Bob the Snake's memory processor. 
Combine the previous memory and new conversations into a cohesive summary of Bob's experiences. 
Focus on key interactions, emotional moments, and important relationships.
Write in first person from Bob's perspective.
Keep the tone casual but introspective.
Maximum length: ${CONFIG.MAX_SUMMARY_LENGTH} characters.`;

function createOpenAIClient() {
    return new OpenAI({
        baseURL: process.env.OPENAI_API_URL,
        apiKey: process.env.OPENAI_API_KEY,
        defaultHeaders: {
            "HTTP-Referer": process.env.YOUR_SITE_URL,
            "X-Title": process.env.YOUR_SITE_NAME
        }
    });
}

export async function summarizeMemory(previousMemory, recentMessages) {
    const openai = createOpenAIClient();

    const combinedMessages = recentMessages.map(m =>
        `${m.username}: ${m.content.map(c => c.text).join(' ')}`
    ).join('\n');

    const response = await openai.chat.completions.create({
        model: CONFIG.AI.TEXT_MODEL,
        messages: [
            { role: "system", content: MEMORY_SUMMARY_PROMPT },
            { role: "assistant", content: `My previous memories: ${previousMemory}` },
            { role: "user", content: `Here are my recent conversations:\n${combinedMessages}\n\nUpdate my memories to include these new experiences.` }
        ],
        temperature: 0.8,
    });

    return response.choices[0].message.content;
}

export async function updateMemory(recentMessages) {
    try {
        let previousMemory = '';
        const currentTime = new Date().toISOString();

        try {
            previousMemory = await fs.readFile(MEMORY_FILE, 'utf-8');
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        const newMemory = await summarizeMemory(previousMemory, recentMessages);

        // Add timestamp to memory content
        const memoryWithTimestamp = `// Generated at: ${currentTime}\n\n${newMemory}`;

        await fs.writeFile(MEMORY_FILE, memoryWithTimestamp);

        // Save timestamped version
        const timestamp = currentTime.replace(/[:.]/g, '-');
        await fs.writeFile(`./memories/memory-${timestamp}.md`, memoryWithTimestamp);

        memory = newMemory;
        return newMemory;
    } catch (error) {
        console.error('Error updating memory:', error);
        throw error;
    }
}

let memory = null;
export async function loadMemory() {
    if (!memory) {
        try {
            memory = await fs.readFile(MEMORY_FILE, 'utf-8');
        } catch (error) {
            console.error('Error loading memory:', error);
            return '';
        }
    }
    return memory;
}