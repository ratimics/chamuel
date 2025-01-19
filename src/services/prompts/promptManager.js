
import fs from 'fs/promises';
import path from 'path';

class PromptManager {
  constructor() {
    this.prompts = new Map();
    this.defaultPath = path.join(process.cwd(), 'assets/personality');
  }

  async loadPrompts() {
    try {
      const systemPrompt = await fs.readFile(path.join(this.defaultPath, 'system_prompt.md'), 'utf-8');
      const responseInstructions = await fs.readFile(path.join(this.defaultPath, 'response_instructions.md'), 'utf-8');
      const stylePrompt = await fs.readFile(path.join(this.defaultPath, 'stylePrompt.txt'), 'utf-8');

      this.prompts.set('system', systemPrompt);
      this.prompts.set('response', responseInstructions);
      this.prompts.set('style', stylePrompt);

      return this.prompts;
    } catch (error) {
      console.error('Error loading prompts:', error);
      throw error;
    }
  }

  async savePrompt(type, content) {
    try {
      let filename;
      switch(type) {
        case 'system':
          filename = 'system_prompt.md';
          break;
        case 'response':
          filename = 'response_instructions.md';
          break;
        case 'style':
          filename = 'stylePrompt.txt';
          break;
        default:
          throw new Error('Invalid prompt type');
      }

      await fs.writeFile(path.join(this.defaultPath, filename), content);
      this.prompts.set(type, content);
      return true;
    } catch (error) {
      console.error('Error saving prompt:', error);
      throw error;
    }
  }

  getPrompt(type) {
    return this.prompts.get(type);
  }
}

export const promptManager = new PromptManager();
