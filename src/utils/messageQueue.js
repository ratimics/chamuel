export class MessageQueue {
  constructor() {
    this.queues = new Map();
    this.processing = false;
  }

  addMessage(chatId, message) {
    if (!this.queues.has(chatId)) {
      this.queues.set(chatId, []);
    }
    this.queues.get(chatId).push(message);
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
