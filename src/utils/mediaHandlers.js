import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import fetch from 'node-fetch';

import { sendWithRetry } from './sendWithRetry.js';

const MAX_CONSECUTIVE_NEWLINES = 3;

const MIME_TYPES = {
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

const MAX_MESSAGE_LENGTH = 4096;

async function sendTextMessage(bot, chatId, text, options = {}) {
  if (!text) return null;

  const normalizedText = text
    .replace(/\n{4,}/g, '\n'.repeat(3))
    .trim();

  if (normalizedText.length <= MAX_MESSAGE_LENGTH) {
    return await sendWithRetry(bot.sendMessage.bind(bot), [
      chatId,
      normalizedText,
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options
      }
    ]);
  }

  const chunks = splitTextPreservingMarkdown(normalizedText);
  const sentMessages = [];

  for (const chunk of chunks) {
    try {
      const sent = await sendWithRetry(bot.sendMessage.bind(bot), [
        chatId,
        chunk,
        {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
          ...options
        }
      ]);
      sentMessages.push(sent);
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`Error sending message chunk: ${error.message}`);
    }
  }

  return sentMessages;
}

async function fetchImageBuffer(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    // Read the full response as an array buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type');
    
    return { buffer, contentType };
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

function isUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

async function processImage(buffer, contentType) {
  // Skip image processing if not an image or is a GIF
  if (!contentType?.startsWith('image/') || contentType === 'image/gif') {
    return buffer;
  }

  try {
    // Try to load the image with sharp
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Only process if we successfully got metadata
    if (metadata) {
      if (metadata.width > 5000 || metadata.height > 5000) {
        return await image
          .resize(5000, 5000, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .toBuffer();
      }

      // Convert PNGs to JPEG
      if (metadata.format === 'png') {
        return await image
          .jpeg({
            quality: 90,
            progressive: true
          })
          .toBuffer();
      }
    }
    
    return buffer;
  } catch (error) {
    console.warn('Image processing failed:', error.message);
    return buffer; // Return original buffer if processing fails
  }
}
function getSendMethod(bot, type) {
  switch (type) {
    case 'photo':
      return bot.sendPhoto.bind(bot);
    case 'animation': // for GIFs
      return bot.sendAnimation.bind(bot);
    case 'video':
      return bot.sendVideo.bind(bot);
    // Add more types as needed
    default:
      return bot.sendDocument.bind(bot);
  }
}
async function sendMedia(bot, chatId, source, options = {}, type = 'photo') {
  try {
    let buffer;
    let contentType;
    let filename;

    if (isUrl(source)) {
      try {
        console.log('Fetching from URL:', source);
        const response = await fetchImageBuffer(source);
        buffer = response.buffer;
        contentType = response.contentType;
        filename = path.basename(new URL(source).pathname) || 'image.jpg';
      } catch (error) {
        console.error('Error fetching from URL:', error);
        throw error;
      }
    } else {
      try {
        const stats = await fs.promises.stat(source);
        if (!stats.isFile()) {
          throw new Error('Not a file');
        }

        const ext = path.extname(source).toLowerCase();
        contentType = MIME_TYPES[ext] || 'application/octet-stream';
        filename = path.basename(source);
        buffer = await fs.promises.readFile(source);
      } catch (error) {
        console.error('Error reading local file:', error);
        throw error;
      }
    }

    // File options with explicit content type and filename
    const fileOptions = {
      filename,
      contentType
    };

    try {
      // Try sending as is first
      const sendMethod = getSendMethod(bot, type);
      return await sendWithRetry(sendMethod, [chatId, buffer, { ...options, ...fileOptions }]);
    } catch (firstError) {
      console.warn('Initial send failed:', firstError.message);
      
      // If initial send fails, try processing the image
      if (contentType?.startsWith('image/') && contentType !== 'image/gif') {
        try {
          const processedBuffer = await processImage(buffer, contentType);
          return await sendWithRetry(getSendMethod(bot, type), [chatId, processedBuffer, { ...options, ...fileOptions }]);
        } catch (processingError) {
          console.warn('Processing and resend failed:', processingError.message);
        }
      }

      // If all else fails, try sending as document
      console.warn('Falling back to document send...');
      return await sendWithRetry(bot.sendDocument.bind(bot), [chatId, buffer, { ...options, ...fileOptions }]);
    }
  } catch (error) {
    console.error(`Error sending media: ${error.message}`);
    throw error;
  }
}

// Helper functions for specific media types
async function sendGif(bot, chatId, source, options = {}) {
  return await sendMedia(bot, chatId, source, options, 'animation');
}

async function sendImage(bot, chatId, source, options = {}) {
  return await sendMedia(bot, chatId, source, options, 'photo');
}

async function sendVideo(bot, chatId, source, options = {}) {
  return await sendMedia(bot, chatId, source, options, 'video');
}

function splitTextPreservingMarkdown(text) {
  const chunks = [];
  let currentChunk = '';
  let openMarkdown = new Map();
  
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > MAX_MESSAGE_LENGTH) {
      currentChunk += Array.from(openMarkdown.values()).reverse().join('');
      chunks.push(currentChunk);
      currentChunk = Array.from(openMarkdown.keys()).join('') + line + '\n';
    } else {
      currentChunk += line + '\n';
    }
    
    const tokens = line.match(/[*_`]/g) || [];
    for (const token of tokens) {
      if (openMarkdown.has(token)) {
        openMarkdown.delete(token);
      } else {
        openMarkdown.set(token, token);
      }
    }
  }
  
  if (currentChunk) {
    currentChunk += Array.from(openMarkdown.values()).reverse().join('');
    chunks.push(currentChunk);
  }
  
  return chunks;
}

export {
  sendTextMessage,
  sendGif,
  sendImage,
  sendVideo,
  sendMedia
};