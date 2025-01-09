export class MessageQueue {
  constructor() {
    this.queues = new Map();
    this.processing = false;
  }

  /**
   * Removes messages older than the given cutoffTime.
   * If a queue becomes empty, removes that chatId entirely from the map.
   *
   * @param {number} cutoffTime - Messages older than this timestamp (ms) will be removed.
   */
  cleanup(cutoffTime) {
    for (const [chatId, queue] of this.queues.entries()) {
      // Filter out old messages
      const filteredQueue = queue.filter(message => {
        return message.timestamp && message.timestamp > cutoffTime;
      });

      // If no messages remain, delete the entire chatId key
      if (filteredQueue.length === 0) {
        this.queues.delete(chatId);
      } else {
        this.queues.set(chatId, filteredQueue);
      }
    }
  }

  addMessage(chatId, message) {
    if (!this.queues.has(chatId)) {
      this.queues.set(chatId, []);
    }
    this.queues.get(chatId).push(message);
  }

  removeMessage(chatId) {
    if (this.queues.has(chatId)) {
      const queue = this.queues.get(chatId);
      if (queue.length > 0) {
        queue.pop();
        if (queue.length === 0) {
          this.queues.delete(chatId);
        }
      }
    }
  }

  hasMessages() {
    return Array.from(this.queues.values()).some(queue => queue.length > 0);
  }

  getAllChats() {
    return Array.from(this.queues.keys());
  }

  getNextMessage(chatId) {
    const queue = this.queues.get(chatId);
    if (queue && queue.length > 0) {
      return queue.shift();
    }
    return null;
  }
}
