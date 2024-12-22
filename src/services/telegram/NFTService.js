import { getWallet } from "../../config/wallet.js";
import { MetaplexStorageService } from "../storage/metaplexStorage.js";

const wallet = getWallet();
const metaplexStorage = new MetaplexStorageService(wallet);

// ----------------------------------------------------
// region: NFT Service
// ----------------------------------------------------
export class NFTService {
    static async createArtNFT(imageBuffer, metadata, tweet = null) {
      try {
        const imageMetadata = {
          name: metadata.name,
          description: metadata.description,
          attributes: [
            ...metadata.attributes,
            { trait_type: 'Type', value: 'Art' },
            ...(tweet ? [{ trait_type: 'Tweet', value: tweet.url }] : [])
          ],
          properties: {
            files: [
              {
                type: 'image/png',
                uri: '' // will be set inside Metaplex
              }
            ],
            ...(tweet && {
              tweet: {
                text: tweet.text,
                url: tweet.url
              }
            })
          }
        };
  
        const nft = await metaplexStorage.createImageNFT(imageBuffer, imageMetadata);
        return `https://solscan.io/token/${nft.address.toString()}`;
      } catch (error) {
        console.error('NFT creation failed:', error);
        return null;
      }
    }
  }
  // ----------------------------------------------------
  // endregion
  // ----------------------------------------------------
  
  