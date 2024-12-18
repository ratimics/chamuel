import { readFile, readdir } from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { MetaplexStorageService } from '../src/services/storage/metaplexStorage.js';
import { getWallet } from '../src/config/wallet.js';
import { retry } from '../src/utils/retry.js';
import { trackNFT } from '../src/services/nft/nftTracker.js';

dotenv.config();

const WEEKLY_MEMORIES_DIR = './weekly_memories';
const CHUNK_SIZE = 90000; // 90KB limit for metadata

async function archiveMemories() {
    const wallet = getWallet();
    const storage = new MetaplexStorageService(wallet);
    
    const files = await readdir(WEEKLY_MEMORIES_DIR);
    files.sort();

    const publishedMemories = [];

    for (const file of files) {
        const content = await readFile(path.join(WEEKLY_MEMORIES_DIR, file), 'utf8');
        const chunks = chunk(content, CHUNK_SIZE);
        
        for (let i = 0; i < chunks.length; i++) {
            const metadata = {
                name: `Bob's Memory - ${file} (Part ${i + 1}/${chunks.length})`,
                description: "A memory fragment from Bob the Snake",
                attributes: [
                    { trait_type: 'Part', value: `${i + 1}/${chunks.length}` },
                    { trait_type: 'Source', value: file },
                    { trait_type: 'Type', value: 'Memory' }
                ],
                properties: {
                    files: [{
                        type: 'text/plain',
                        uri: '' // Will be set after upload
                    }]
                }
            };

            try {
                // Upload content with retry
                const uri = await retry(
                    () => storage.uploadContent(chunks[i], metadata),
                    3
                );
                metadata.properties.files[0].uri = uri;
                
                if (process.env.CREATE_MEMORY_NFTS === 'true') {
                    const nft = await retry(
                        () => storage.createMemoryNFT(chunks[i], metadata),
                        3
                    );
                    console.log(`Created NFT: ${nft.address.toString()}`);
                    trackNFT(nft.address.toString(), metadata);
                }

                publishedMemories.push({
                    content: chunks[i],
                    uri,
                    timestamp: new Date(file.split('-')[1].split('.')[0]).getTime(),
                    metadata
                });

                console.log(`Published memory chunk ${i + 1}/${chunks.length} for ${file}`);
            } catch (error) {
                console.error(`Failed to process chunk ${i + 1} of ${file}:`, error);
            }
        }
    }

    // Publish the index with retry
    const indexUri = await retry(
        () => storage.uploadIndex(publishedMemories),
        3
    );
    console.log(`Published memory index - URI: ${indexUri}`);
}

archiveMemories().catch(console.error);