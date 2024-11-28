import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'telegram-bot';

class MongoDBService {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = await MongoClient.connect(MONGODB_URI);
      this.db = this.client.db(MONGODB_DB_NAME);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  getCollection(name) {
    if (!this.db) throw new Error('MongoDB not connected');
    return this.db.collection(name);
  }
}

// Create singleton instance
const mongoDBService = new MongoDBService();
export default mongoDBService;
