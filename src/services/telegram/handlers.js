import { CONFIG, SYSTEM_PROMPT } from '../../config/index.js';
import { generateImage, getLLMPrompt, updateStylePrompt } from '../../utils/imageGenerator.js';

import { postX } from '../x/x.js';

import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { uploadImage } from '../s3/s3imageService.js';

const STYLE_PROMPT_FILE = CONFIG.AI.STYLE_PROMPT_FILE || './assets/personality/stylePrompt.txt';

// In-memory state for chat histories and timers
const state = {
  chatHistories: {},
  timers: {} // To track timers per chatId
};

// Batch interval in milliseconds (30 seconds)
const BATCH_INTERVAL = 30000;

const IMAGE_INTERVAL = 60 * 60 * 1000;
const XPOST_INTERVAL = 2 * 60 * 60 * 1000;
let lastPostTime = 0;
let lastImageTime = 0;
let rateLimited = false;

import mongoDBService from '../mongodb/mongodb.js';

// Revised handleText to process accumulated messages
export async function handleText(chatId, openai) {

  try {
    const history = state.chatHistories[chatId] || [];
    if (history.length === 0) return null;

    // Combine all messages in the history
    const combinedMessages = history.map(h => {
      const contentText = h.content.map(c => {
        if (c.type === "image_description") {
          return `[Image: ${c.text}]`;
        }
        return c.text;
      }).join(' ');

      return `${h.username}: ${contentText}`;
    }).join('\n');

    let shouldGenerateImage = Date.now() - lastImageTime > IMAGE_INTERVAL;

    if (shouldGenerateImage) {
      const decisionMessages = [
        { role: "system", content: "You are a YES or NO decider. You ONLY respond with YES or NO" },
        { role: "user", content: "Are you AI?" },
        { role: "assistant", content: "YES" },
        { role: "user", content: "Are you a human?" },
        { role: "assistant", content: "NO" },
        { role: "user", content: combinedMessages + "\n\n Has someone asked for a drawing or image or meme? Reply with a single word: \"YES\" or \"NO\"" }
      ];
      const decision = await openai.chat.completions.create({
        model: CONFIG.AI.TEXT_MODEL_SMALL,
        messages: decisionMessages,
        max_tokens: 1,
        temperature: 0.5,
      });

      console.log('Decision:', decision.choices[0].message.content);

      shouldGenerateImage = `${decision?.choices[0]?.message?.content}`.toUpperCase() === "YES";
    }
    let imageUrl = null;
    let imageDescription = null;
    let imageTweet = null;
    let stylePrompt;

    try {
      // Check if the file exists
      await fs.access(STYLE_PROMPT_FILE, fs.constants.F_OK);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create it with default content
        const defaultContent = 'A funny meme, signed by "Bob the Snake"';
        await fs.writeFile(STYLE_PROMPT_FILE, defaultContent);
      } else {
        // Other errors
        console.error('Error accessing style prompt file:', error);
        throw error;
      }
    }

    // Read the file after ensuring it exists
    stylePrompt = await fs.readFile('./stylePrompt.txt', 'utf-8');

    if (shouldGenerateImage) {
      lastImageTime = Date.now();
      const imagePrompt = await getLLMPrompt(combinedMessages);
      const imageBuffer = await generateImage(imagePrompt + "\n\n" + stylePrompt);

      
      // Save the file locally
      const filePath = `./images/${randomUUID()}.png`;
      await fs.writeFile(filePath, imageBuffer);
      console.log('Generated image:', filePath);

      try {
        imageUrl = await uploadImage(filePath);
        console.log('Uploaded image:', imageUrl);
        // 10% chance to update the style prompt
        if (Math.random() < 0.1) {
          stylePrompt = await updateStylePrompt(stylePrompt, imageUrl);
          await fs.writeFile('./stylePrompt.txt', stylePrompt);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }

      imageDescription = `Generated image based on prompt: ${imagePrompt}`;

      // Add image description to history
      state.chatHistories[chatId].push({
        role: 'assistant',
        content: [{ type: "image_description", text: imageDescription }],
        timestamp: Date.now()
      });

      if (!rateLimited && Date.now() - lastPostTime > XPOST_INTERVAL) {
        lastPostTime = Date.now();
        // Compose a sassy tweet to go along with it
        const response = await openai.chat.completions.create({
          model: CONFIG.AI.TEXT_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "assistant", content: `I generated an image with the following description:\n\n ${imageDescription}` },
            { role: "user", content: "Write a tweet to go with the image you generated." }
          ],
          max_tokens: 128,
          temperature: 0.8,
        });

        imageTweet = response.choices[0].message.content.trim();
        console.log('🐦 Tweet:', imageTweet);
        await postX({ text: imageTweet }, '', imageBuffer);
      }
    }


    // Get the latest tweets

    async function getLastThreeTweetsByUsername(username) {
      const author = await mongoDBService.getCollection("authors").findOne({ username });
      if (!author) {
        return [];
      }
    
      const tweets = await mongoDBService.getCollection("tweets")
        .find({ author_id: author.id })
        .sort({ id: -1 })
        .limit(3)
        .toArray();
    
      return tweets;
    }

    const tweets = await getLastThreeTweetsByUsername("bobthesnek");

    // Prepare messages for AI completion
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(tweets?.length ? [{ role: "assistant", content: `I tweeted from my account @bobthesnek:\n\n${tweets.map(t => t.text).join('\n\n')}` }] : []),
      ...(imageDescription ? [{ role: "assistant", content: `I generated an image:  ${imageDescription}` }] : []),
      { role: "user", content: combinedMessages + "\n\n" + "Respond naturally as Bob the Snake with one or two SHORT sentences or *actions* " }
    ];

    const response = await openai.chat.completions.create({
      model: CONFIG.AI.TEXT_MODEL,
      messages,
      max_tokens: 128,
      temperature: 0.8,
    });

    const aiResponse = response.choices[0].message.content.trim();

    // Add AI response to history
    state.chatHistories[chatId].push({
      role: 'assistant',
      content: [{ type: "text", text: aiResponse }],
      timestamp: Date.now()
    });

    return { text: aiResponse, imageUrl };
  } catch (error) {
    console.error('Error handling text:', error);
    return null;
  }
}

// Export the state object
export { state };
