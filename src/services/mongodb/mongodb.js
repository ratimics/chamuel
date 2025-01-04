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
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable not set');
      }
      this.client = await MongoClient.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      this.db = this.client.db(MONGODB_DB_NAME);
      console.log('Connected to MongoDB');

      // Handle connection loss
      this.client.on('close', () => {
        console.warn('MongoDB connection closed. Attempting to reconnect...');
        setTimeout(() => this.connect(), 5000);
      });
    } catch (error) {
      console.error('MongoDB connection error:', error);
      // Don't throw, return error status
      return { connected: false, error: error.message };
    }
    return { connected: true };
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