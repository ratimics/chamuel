import { CONFIG } from '../../config/index.js';
import fs from 'fs/promises';
import OpenAI from 'openai';
import { MetaplexStorageService } from '../storage/metaplexStorage.js';
import { getWallet } from '../../config/wallet.js';
import { retry } from '../../utils/retry.js';

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
      'HTTP-Referer': process.env.YOUR_SITE_URL,
      'X-Title': process.env.YOUR_SITE_NAME
    }
  });
}

export async function summarizeMemory(previousMemory, recentMessages) {
  const openai = createOpenAIClient();

  const combinedMessages = recentMessages
    .map((m) => `${m.username}: ${m.content}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: CONFIG.AI.TEXT_MODEL,
    messages: [
      { role: 'system', content: MEMORY_SUMMARY_PROMPT },
      { role: 'assistant', content: `My previous memories: ${previousMemory}` },
      {
        role: 'user',
        content: `Here are my recent conversations:\n${combinedMessages}\n\nUpdate my memories to include these new experiences.`
      }
    ],
    temperature: 0.8
  });

  return response.choices[0].message.content;
}

async function publishMemoryToSolana(memory, timestamp) {
  if (process.env.SOLANA_ENABLED !== 'true') return null;

  try {
    const storage = new MetaplexStorageService(getWallet());

    const metadata = {
      name: `Bob's Memory - ${timestamp}`,
      description: 'A memory fragment from Bob the Snake',
      attributes: [
        { trait_type: 'Type', value: 'Memory' },
        { trait_type: 'Timestamp', value: timestamp }
      ],
      properties: {
        files: [
          {
            type: 'text/plain',
            uri: '' // Will be set during upload
          }
        ]
      }
    };

    // Upload memory content to decentralized storage
    const uri = await retry(() => storage.uploadContent(memory, metadata), 3);

    // Optionally create an NFT if configured
    if (process.env.CREATE_MEMORY_NFTS === 'true') {
      const nft = await retry(
        () => storage.createMemoryNFT(memory, metadata.name),
        3
      );
      console.log(`Created memory NFT: ${nft.address.toString()}`);
      return nft.address.toString();
    }

    return uri;
  } catch (error) {
    console.error('Failed to publish memory to Solana:', error);
    return null;
  }
}

/**
 * Returns the Date object parsed from the memory file's first line
 * or null if not found or not parsable.
 */
async function getLastUpdateDate() {
  try {
    const memoryContent = await fs.readFile(MEMORY_FILE, 'utf-8');
    // Expect a line like: // Generated at: 2024-01-01T12-00-00Z
    const match = memoryContent.match(/^\/\/ Generated at:\s*(.+)$/m);
    if (match && match[1]) {
      // Replace dashes in time to reconstruct the valid ISO time
      // e.g. 2024-01-01T12-00-00Z => 2024-01-01T12:00:00Z
      const timestamp = match[1].replace(/-/g, ':').replace('T12::00::00Z','T12:00:00Z'); // just an example fix
      // The above might need more careful logic if your date format contains more dashes than just time
      return new Date(timestamp);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error reading memory file:', err);
    }
  }
  return null;
}

/**
 * Updates memory, ensuring only one update per 24 hours.
 */
export async function updateMemory(recentMessages) {
  try {
    const lastUpdateDate = await getLastUpdateDate();
    const now = new Date();

    // If memory was updated in the last 24 hours, skip
    if (lastUpdateDate && now - lastUpdateDate < 24 * 60 * 60 * 1000) {
      console.log(`Memory was updated less than 24 hours ago. Skipping update.`);
      return {
        memory: memory,
        nftAddress: null
      };
    }

    // Attempt to read existing memory file
    let previousMemory = '';
    try {
      previousMemory = await fs.readFile(MEMORY_FILE, 'utf-8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    // Summarize memory and produce new memory content
    const newMemory = await summarizeMemory(previousMemory, recentMessages);

    // Prepare final memory content with timestamp
    // Note: we store the exact current ISO string in the // Generated at: line
    const currentTimeISO = now.toISOString(); // e.g. 2024-01-01T12:00:00.000Z
    const memoryWithTimestamp = `// Generated at: ${currentTimeISO}\n\n${newMemory}`;

    // Write to main memory file
    await fs.writeFile(MEMORY_FILE, memoryWithTimestamp);

    // Save a timestamped version in ./memories/
    const safeTimestamp = currentTimeISO.replace(/[:.]/g, '-');
    await fs.writeFile(
      `./memories/memory-${safeTimestamp}.md`,
      memoryWithTimestamp
    );

    // Publish to Solana if enabled
    const nftAddress = await publishMemoryToSolana(newMemory, currentTimeISO);

    // Store in the global memory variable
    memory = newMemory;

    return { memory: newMemory, nftAddress };
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
