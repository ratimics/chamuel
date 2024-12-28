import { CONFIG } from '../../config/index.js';
import fs from 'fs/promises';
import OpenAI from 'openai';
import { MetaplexStorageService } from '../storage/metaplexStorage.js';
import { getWallet } from '../../config/wallet.js';
import { retry } from '../../utils/retry.js';
import path from 'path';

const MEMORY_FILE = './memory.md';
const MEMORY_DIR = './memories';
const MEMORY_STATE_FILE = path.join(MEMORY_DIR, 'memory_state.json');
const MEMORY_SUMMARY_PROMPT = `You are Bob the Snake's memory processor. 
Combine the previous memory and new conversations into a cohesive summary of Bob's experiences. 
Focus on key interactions, emotional moments, and important relationships.
Write in first person from Bob's perspective.
Keep the tone casual but introspective.
Maximum length: ${CONFIG.MAX_SUMMARY_LENGTH} characters.`;

// Track memory generation state
let lastMemoryDate = null;

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

async function loadMemoryState() {
  try {
    const data = await fs.readFile(MEMORY_STATE_FILE, 'utf-8');
    const state = JSON.parse(data);
    lastMemoryDate = new Date(state.lastMemoryDate);
  } catch (error) {
    lastMemoryDate = new Date(0); // Set to epoch if no state exists
  }
}

async function saveMemoryState() {
  const state = {
    lastMemoryDate: lastMemoryDate.toISOString()
  };
  await fs.writeFile(MEMORY_STATE_FILE, JSON.stringify(state, null, 2));
}

async function shouldGenerateMemory() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!lastMemoryDate || lastMemoryDate < today) {
    return true;
  }
  return false;
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
    // Load existing state
    await loadMemoryState();

    // Check if we should generate a new memory
    if (!await shouldGenerateMemory()) {
      console.log('[updateMemory] Daily memory already generated, skipping...');
      return;
    }

    // Ensure memory directory exists
    await fs.mkdir(MEMORY_DIR, { recursive: true });

    // Generate memory filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const memoryFile = path.join(MEMORY_DIR, `memory_${timestamp}.md`);

    // Format messages into markdown
    const markdown = recentMessages
      .map(msg => `## ${msg.sender.username}\n${msg.content}\n`)
      .join('\n');

    // Write memory file
    await fs.writeFile(memoryFile, markdown);

    // Update last memory date
    lastMemoryDate = new Date();
    await saveMemoryState();

    console.log(`[updateMemory] Generated new memory and KG DSL: ${memoryFile}`);
  } catch (error) {
    console.error('[updateMemory] Error updating memory:', error);
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
