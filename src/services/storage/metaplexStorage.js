import { createUmiInstance } from '../../config/umi.js';
import { generateSigner, signerIdentity } from '@metaplex-foundation/umi';
import { create } from '@metaplex-foundation/mpl-core';
import { trackNFT } from '../nft/nftTracker.js';

export class MetaplexStorageService {
    constructor(wallet) {
        this.umi = createUmiInstance();
        this.umi.use(signerIdentity(wallet));
        console.log('MetaplexStorage initialized with wallet:', wallet.publicKey);
    }

    async uploadContent(content) {
        const uri = await this.umi.uploader.uploadJson({
            name: "Content",
            description: "Uploaded content",
            content
        });
        return uri;
    }

    async uploadImage(buffer) {
        return this.umi.uploader.upload(buffer);
    }

    async createImageNFT(imageBuffer, metadata) {
        const [imageUri] = await this.umi.uploader.upload([imageBuffer]);
        const uri = await this.umi.uploader.uploadJson({
            ...metadata,
            image: imageUri
        });

        const assetSigner = generateSigner(this.umi);
        const result = await create(this.umi, {
            asset: assetSigner,
            name: metadata.name,
            uri,
            plugins: metadata.plugins || [],
        }).sendAndConfirm(this.umi);

        await trackNFT({
            address: assetSigner.publicKey,
            type: 'image',
            name: metadata.name,
            description: metadata.description,
            uri,
            metadata: {
                ...metadata,
                image: imageUri
            }
        });
        
        return {
            address: assetSigner.publicKey,
            uri
        };
    }

    async createMemoryNFT(content, metadata) {
        const uri = await this.uploadContent(content);
        
        const nft = await createNft(this.umi, {
            name: metadata.name,
            uri,
            sellerFeeBasisPoints: 0,
            symbol: 'BOBMEM',
            isCollection: false,
        }).sendAndConfirm(this.umi);

        await trackNFT({
            address: nft.mintAddress.toString(),
            type: 'memory',
            name: metadata.name,
            description: metadata.description,
            uri,
            metadata: {
                ...metadata,
                content
            }
        });

        return {
            address: nft.mintAddress,
            uri
        };
    }

    async uploadIndex(memories) {
        return this.umi.uploader.uploadJson({
            name: "Bob's Memory Index",
            description: "Index of Bob's memories on Solana",
            memories
        });
    }
}