import { MongoClient } from 'mongodb';

export class ChannelAnalyzer {
    constructor(mongoUrl) {
        this.mongoUrl = mongoUrl;
        this.client = new MongoClient(mongoUrl);
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db('chamber_analysis');
            
            // Test connection and permissions
            await this.db.command({ ping: 1 });
            await this.db.collection('channel_summaries').findOne({});
            
            this.isConnected = true;
            console.log('[ChannelAnalyzer] Successfully connected to MongoDB');
        } catch (error) {
            console.error('[ChannelAnalyzer] Connection error:', error.message);
            this.isConnected = false;
            // Create in-memory fallback
            this.channelSummaries = new Map();
            this.entityProfiles = new Map();
            console.log('[ChannelAnalyzer] Using in-memory fallback storage');
        }
    }

    async updateChannelSummary(channelName, messages) {
        if (!this.isConnected) {
            // Use in-memory fallback
            const existing = this.channelSummaries.get(channelName) || { messageCount: 0 };
            this.channelSummaries.set(channelName, {
                channelName,
                lastUpdated: new Date(),
                messageCount: existing.messageCount + messages.length,
                recentTopics: messages.map(m => m.content).join('\n')
            });
            return;
        }

        try {
            const collection = this.db.collection('channel_summaries');
        
            const summary = await collection.findOne({ channelName });
            const newSummary = {
                channelName,
                lastUpdated: new Date(),
                messageCount: (summary?.messageCount || 0) + messages.length,
                recentTopics: messages.map(m => m.content).join('\n'),
                // Add more analysis fields as needed
            };

            await collection.updateOne(
                { channelName },
                { $set: newSummary },
                { upsert: true }
            );
        } catch (error) {
            console.error('[ChannelAnalyzer] Failed to update channel summary:', error);
        }
    }

    async updateEntityProfile(username, message) {
        if (!this.isConnected) {
            // Use in-memory fallback
            const existing = this.entityProfiles.get(username) || { recentMessages: [] };
            this.entityProfiles.set(username, {
                username,
                lastSeen: new Date(),
                recentMessages: [...existing.recentMessages, message].slice(-50)
            });
            return;
        }

        try {
            const collection = this.db.collection('entity_profiles');
        
            await collection.updateOne(
                { username },
                {
                    $set: {
                        lastSeen: new Date(),
                    },
                    $push: {
                        recentMessages: {
                            $each: [message],
                            $slice: -50 // Keep last 50 messages
                        }
                    }
                },
                { upsert: true }
            );
        } catch (error) {
            console.error('[ChannelAnalyzer] Failed to update entity profile:', error);
        }
    }

    async getChannelContext(channelName) {
        if (!this.isConnected) {
            return this.channelSummaries.get(channelName) || { 
                channelName,
                messageCount: 0,
                lastUpdated: new Date(),
                recentTopics: ''
            };
        }

        try {
            const collection = this.db.collection('channel_summaries');
            return await collection.findOne({ channelName });
        } catch (error) {
            console.error('[ChannelAnalyzer] Failed to get channel context:', error);
            return { channelName, error: 'Failed to fetch context' };
        }
    }

    async getEntityProfile(username) {
        if (!this.isConnected) {
            return this.entityProfiles.get(username) || { 
                username,
                lastSeen: new Date(),
                recentMessages: []
            };
        }

        try {
            const collection = this.db.collection('entity_profiles');
            return await collection.findOne({ username });
        } catch (error) {
            console.error('[ChannelAnalyzer] Failed to get entity profile:', error);
            return { username, error: 'Failed to fetch profile' };
        }
    }

    async getRecentEntityProfiles(channelName) {
        if (!this.isConnected) {
            return Array.from(this.entityProfiles.values()).filter(profile => 
                profile.recentMessages.some(m => m.channelName === channelName) &&
                profile.lastSeen >= new Date(Date.now() - 24 * 60 * 60 * 1000)
            );
        }

        try {
            const collection = this.db.collection('entity_profiles');
        
            // Find entities that have recently participated in this channel
            return await collection.find({
                'recentMessages.channelName': channelName,
                lastSeen: { 
                    $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            }).toArray();
        } catch (error) {
            console.error('[ChannelAnalyzer] Failed to get recent entity profiles:', error);
            return [];
        }
    }

    async close() {
        await this.client.close();
    }
}
