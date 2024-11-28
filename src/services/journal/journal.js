import { PinataService } from '../pinata/pinata.js';
import { CONFIG } from '../../config/index.js';
import fs from 'fs/promises';
import path from 'path';

export class JournalService {
  constructor() {
    this.pinata = new PinataService();
    this.hashPath = CONFIG.PATHS.JOURNAL_HASH;
  }

  async loadJournal() {
    try {
      const hash = await this.getStoredHash();
      if (hash) {
        return await this.pinata.retrievePin(hash);
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

      const result = await this.pinata.pinJSON(journalVersion);
      await this.saveHashFile(result.IpfsHash);
      return result.IpfsHash;
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
    return await this.pinata.retrievePin(hash);
  }
}
