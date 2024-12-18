
import fs from 'fs/promises';
import path from 'path';
import mongoDBService from '../mongodb/mongodb.js';

const NFT_DIR = './nfts';

export async function trackNFT(nftData) {
    const {
        address,
        type,
        name,
        description,
        uri,
        metadata,
        timestamp = Date.now()
    } = nftData;

    // Ensure NFT directory exists
    await fs.mkdir(NFT_DIR, { recursive: true });

    // Save to filesystem
    const filename = `${address}.json`;
    await fs.writeFile(
        path.join(NFT_DIR, filename),
        JSON.stringify({ ...nftData, timestamp }, null, 2)
    );

    // Save to MongoDB
    await mongoDBService.getCollection("nfts").insertOne({
        address,
        type,
        name,
        description,
        uri,
        metadata,
        timestamp
    });

    return { address, uri };
}