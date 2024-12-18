import fs from 'fs/promises';
import path from 'path';
import net from 'net';
import { CONFIG } from '../config/index.js';
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js'; // Updated import for Solana
import axios from 'axios'; // Import axios for HTTP requests

export class FileOps {
  static async readJSON(filepath) {
    try {
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw new Error(`Error reading ${filepath}: ${error.message}`);
    }
  }

  static async writeJSON(filepath, data) {
    try {
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      throw new Error(`Error writing ${filepath}: ${error.message}`);
    }
  }

  static async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

export class RetryHelper {
  static async retry(operation, options = {}) {
    const {
      retries = CONFIG.AI.MAX_RETRIES,
      delay = CONFIG.AI.RETRY_DELAY,
      shouldRetry = () => true
    } = options;

    let lastError;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (!shouldRetry(error) || attempt === retries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
    throw lastError;
  }
}

export class BotNotifier {
  static async notifyReload() {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      const timeout = setTimeout(() => {
        client.destroy();
        reject(new Error('Notification timeout'));
      }, 5000);

      client.connect(4000, '127.0.0.1', () => {
        client.write('reload_prompt');
      });

      client.on('data', (data) => {
        clearTimeout(timeout);
        client.destroy();
        resolve(data.toString());
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        client.destroy();
        reject(err);
      });
    });
  }
}

export class BlockchainUtils {
  static validateSolanaAddress(address) {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  static async uploadToPinata(pinata, data) {
    try {
      if (!pinata || !pinata.pinJSON) {
        throw new Error('Invalid Pinata client configuration');
      }

      const options = {
        pinataMetadata: { 
          name: `data_${Date.now()}` 
        },
        pinataOptions: { 
          cidVersion: 0 
        }
      };

      const result = await pinata.pinJSON(data, options);
      if (!result || !result.IpfsHash) {
        throw new Error('Invalid response from Pinata');
      }
      return result.IpfsHash;
    } catch (error) {
      console.error('Pinata upload error:', error);
      throw new Error(`Pinata upload failed: ${error.message || 'Unknown error'}`);
    }
  }

  static async fetchFromPinata(ipfsHash) {
    try {
      const response = await axios.get(`${CONFIG.PINATA.GATEWAY}${ipfsHash}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch data from Pinata: ${error.message}`);
    }
  }

  static async getSolanaConnection() {
    const rpcUrl = CONFIG.SOLANA.RPC_URL || clusterApiUrl('mainnet-beta');
    console.log('Connecting to Solana RPC URL:', rpcUrl);
    const connection = new Connection(
      rpcUrl,
      {
        commitment: CONFIG.SOLANA.COMMITMENT || 'confirmed',
        disableRetryOnRateLimit: false
      }
    );
    return connection;
  }
}

export function debounce(func, wait) {
  const timeouts = new Map();
  
  return function(key, ...args) {
    if (timeouts.has(key)) {
      clearTimeout(timeouts.get(key));
    }
    
    timeouts.set(key, setTimeout(() => {
      func.apply(this, args);
      timeouts.delete(key);
    }, wait));
  };
}
