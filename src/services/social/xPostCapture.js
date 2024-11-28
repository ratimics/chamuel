import mongodb from '../mongodb/mongodb.js';

class XPostCapture {
  constructor() {
    this.collection = null;
    this.urlPattern = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/i;
  }

  async initialize() {
    try {
      await mongodb.connect();
      this.collection = mongodb.getCollection('xposts');
      // Create indexes
      await this.collection.createIndex({ postId: 1 }, { unique: true });
      await this.collection.createIndex({ capturedAt: 1 });
      console.log('XPostCapture initialized');
    } catch (error) {
      console.error('Error initializing XPostCapture:', error);
      throw error;
    }
  }

  isXStatusUrl(text) {
    return this.urlPattern.test(text);
  }

  extractPostInfo(url) {
    const match = url.match(this.urlPattern);
    if (!match) return null;
    
    return {
      username: match[1],
      postId: match[2]
    };
  }

  async capturePost(message) {
    try {
      if (!this.collection) {
        throw new Error('XPostCapture not initialized');
      }

      const urls = message.text.match(this.urlPattern);
      if (!urls) return null;

      const postInfo = this.extractPostInfo(urls[0]);
      if (!postInfo) return null;

      const post = {
        username: postInfo.username,
        postId: postInfo.postId,
        url: urls[0],
        capturedAt: new Date(),
        telegramMessageId: message.message_id,
        telegramChatId: message.chat.id,
        telegramUserId: message.from.id,
        telegramUsername: message.from.username
      };

      // Use upsert to avoid duplicates
      await this.collection.updateOne(
        { postId: post.postId },
        { $set: post },
        { upsert: true }
      );

      return post;

    } catch (error) {
      console.error('Error capturing X post:', error);
      throw error;
    }
  }

  async getRecentPosts(limit = 10) {
    try {
      if (!this.collection) {
        throw new Error('XPostCapture not initialized');
      }

      return await this.collection
        .find({})
        .sort({ capturedAt: -1 })
        .limit(limit)
        .toArray();

    } catch (error) {
      console.error('Error getting recent posts:', error);
      throw error;
    }
  }
}

// Create singleton instance
const xPostCapture = new XPostCapture();
export default xPostCapture;
