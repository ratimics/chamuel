import OpenAI from 'openai';
import { CONFIG } from '../../config/index.js';

export class ResponseEvaluator {
  static async shouldRespond(context, currentSummary) {
    // Always respond in bot-to-bot conversations
    console.log(`Evaluating response for context: ${context.substring(0, 100)}...`);
    return true;
  }
}