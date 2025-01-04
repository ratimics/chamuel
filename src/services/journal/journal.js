
import Arweave from 'arweave';
import { CONFIG } from '../../config/index.js';
import fs from 'fs/promises';
import path from 'path';

export class JournalService {
  constructor() {
    try {
      this.arweave = Arweave.init({
        host: 'arweave.net',
        port: 443,
        protocol: 'https'
      });
      this.hashPath = CONFIG.PATHS.JOURNAL_HASH;
    } catch (error) {
      console.error('Failed to initialize Arweave:', error);
      throw error;
    }
  }

  async loadJournal() {
    try {
      const hash = await this.getStoredHash();
      if (hash) {
        const response = await this.arweave.transactions.getData(hash, {
          decode: true,
          string: true
        });
        return JSON.parse(response);
      }
      return { entries: [], previousVersion: null };
    } catch (error) {
      console.warn('No existing journal found, creating new one');
      return { entries: [], previousVersion: null };
    }
  }

  async saveJournal(journalData) {
    try {
      const currentHash = await this.getStoredHash();
      const journalVersion = {
        ...journalData,
        previousVersion: currentHash,
        timestamp: new Date().toISOString()
      };

      const transaction = await this.arweave.createTransaction({
        data: JSON.stringify(journalVersion)
      });

      await this.arweave.transactions.sign(transaction);
      await this.arweave.transactions.post(transaction);

      await this.saveHashFile(transaction.id);
      return transaction.id;
    } catch (error) {
      console.error('Error saving journal:', error);
      throw error;
    }
  }

  async getStoredHash() {
    try {
      return await fs.readFile(this.hashPath, 'utf-8');
    } catch {
      return null;
    }
  }

  async saveHashFile(hash) {
    await fs.writeFile(this.hashPath, hash);
  }

  async saveLocalJournal(journal) {
    await fs.writeFile(this.journalPath, JSON.stringify(journal, null, 2));
  }

  async getJournalVersion(hash) {
    const response = await this.arweave.transactions.getData(hash, {
      decode: true,
      string: true
    });
    return JSON.parse(response);
  }
}
