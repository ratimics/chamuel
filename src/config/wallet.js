import dotenv from 'dotenv';
import fs from 'fs';
import { createUmiInstance } from './umi.js';
import { keypairIdentity } from '@metaplex-foundation/umi';
import { generateSigner } from '@metaplex-foundation/umi';

dotenv.config();

const DEV_WALLET_PATH = './.dev-wallet.json';

export function getWallet() {
    const umi = createUmiInstance();
    
    // Production: Use environment variable
    if (process.env.WALLET_PRIVATE_KEY) {
        const secretKey = new Uint8Array(JSON.parse(process.env.WALLET_PRIVATE_KEY));
        const signer = generateSigner(umi);
        signer.secretKey = secretKey;
        umi.use(keypairIdentity(signer));
        return signer;
    }

    // Development: Use local file
    if (process.env.NODE_ENV !== 'production') {
        try {
            if (!fs.existsSync(DEV_WALLET_PATH)) {
                // Generate new development wallet
                const signer = generateSigner(umi);
                fs.writeFileSync(
                    DEV_WALLET_PATH,
                    JSON.stringify(Array.from(signer.secretKey)),
                    { mode: 0o600 }
                );
                console.warn('Created new development wallet:', signer.publicKey);
                umi.use(keypairIdentity(signer));
                return signer;
            }
            
            const devKey = new Uint8Array(JSON.parse(fs.readFileSync(DEV_WALLET_PATH, 'utf-8')));
            const signer = generateSigner(umi);
            signer.secretKey = devKey;
            umi.use(keypairIdentity(signer));
            return signer;
        } catch (error) {
            console.error('Error loading development wallet:', error);
            throw error;
        }
    }

    throw new Error('No wallet configuration found');
}