import { createUmi as createBaseUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { CONFIG } from './index.js';
import { clusterApiUrl } from '@solana/web3.js';

export function createUmiInstance() {
    const endpoint = CONFIG.SOLANA.RPC_URL || clusterApiUrl('devnet');

    const umi = createBaseUmi(endpoint, {
        commitment: 'confirmed',
        preflight: true,
        rateLimit: {
            maxConcurrent: 2,
            minInterval: 500,
        },
        connection: {
            httpHeaders: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        }
    });

    const uploader = irysUploader({
        address: CONFIG.IRYS.ADDRESS || 'https://node2.irys.xyz',
        timeout: CONFIG.IRYS.TIMEOUT || 30000,
        providerUrl: endpoint,
        priceMultiplier: 1.1,
        withdrawMax: true,
        useBundlr: false, // Use newer Irys API
    });

    umi.use(uploader);

    return umi;
}