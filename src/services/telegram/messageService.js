// ----------------------------------------------------
// region: messageService.js
// ----------------------------------------------------
import mongoDBService from '../mongodb/mongodb.js';

export class MessageService {
  static async fetchChatHistory(chatId, limit = 100) {
    const history = await mongoDBService
      .getCollection('messages')
      .find({ chatId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    return history.reverse();
  }

  static async storeAssistantMessage(chatId, content) {
    await mongoDBService.getCollection('messages').insertOne({
      chatId,
      role: 'assistant',
      content,
      timestamp: Date.now()
    });
  }

  static async deleteOldMessages(chatId, keepCount = 50) {
    // Keep the latest N messages
    const history = await this.fetchChatHistory(chatId);
    if (history.length <= keepCount) return;
    await mongoDBService.getCollection('messages').deleteMany({
      chatId,
      timestamp: { $lt: history[keepCount - 1].timestamp }
    });
  }

  static combineMessages(history) {
    return history
      .map(h => {
        const contentText = h.content
          .map(c => (c.type === 'image_description' ? `[Image: ${c.text}]` : c.text))
          .join(' ');
        return `${h.username}: ${contentText}`;
      })
      .join('\n');
  }
}
