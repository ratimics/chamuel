import { CONFIG, SYSTEM_PROMPT } from '../../config/index.js';
import { generateImage, getLLMPrompt, updateStylePrompt } from '../../utils/imageGenerator.js';

import { postX } from '../x/x.js';

import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { uploadImage } from '../s3/s3imageService.js';

import { updateMemory, loadMemory } from '../memory/memoryService.js';

const STYLE_PROMPT_FILE = CONFIG.AI.STYLE_PROMPT_FILE || './assets/personality/stylePrompt.txt';

// Simplified state object - only keep what's needed
const state = {
  timers: {}  // Keep timers in memory
};

const IMAGE_INTERVAL = 60 * 60 * 1000;
const XPOST_INTERVAL = 2 * 60 * 60 * 1000;
let lastPostTime = 0;
let lastImageTime = 0;
let rateLimited = false;

import mongoDBService from '../mongodb/mongodb.js';

const lastMessageDecisions = {};
// Revised handleText to process accumulated messages
export async function handleText(chatId, openai, bot) {
  try {
    // Load chat history from MongoDB
    const history = (await mongoDBService.getCollection("messages")
      .find({ chatId })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray()).reverse();

    if (history.length === 0) return null;

    // Check if message was already processed
    if (lastMessageDecisions[chatId] >= history[history.length - 1].timestamp) {
      return null;
    }
    lastMessageDecisions[chatId] = history[history.length - 1].timestamp;

    // Update memory when needed
    if (history.length >= 100) {
      await updateMemory(history);
      // Remove old messages but keep last 50
      await mongoDBService.getCollection("messages").deleteMany({
        chatId,
        timestamp: { $lt: history[49].timestamp }
      });
    }

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

    if (!history[history.length - 1].content[0].text.toLowerCase().includes("bob")) {

      const respondDeciderMessages = [
        { role: "system", content: "You are Bob the Obsequious snake's executive function. You ONLY respond with YES or NO" },
        { role: "assistant", content: `Here is what I remember:${await loadMemory()}` },
        {
          role: "user", content: `
        ${combinedMessages}
        \n\nIs Bob the Snake part of this discussion and would it be appropriate for him to respond? Answer YES or NO.` },
      ];

      const respondDecider = await openai.chat.completions.create({
        model: CONFIG.AI.TEXT_MODEL_SMALL,
        messages: respondDeciderMessages,
        max_tokens: 1,
        temperature: 0.7,
      });

      console.log('Respond Decider:', respondDecider.choices[0].message.content);
      if (`${respondDecider?.choices[0]?.message?.content}`.toUpperCase() === "NO") {
        return null;
      }
    }
    await bot.sendChatAction(chatId, 'typing');

    let shouldGenerateImage = (Math.random() < 0.4) && (Date.now() - lastImageTime > IMAGE_INTERVAL);

    if (shouldGenerateImage) {
      const decisionMessages = [
        { role: "system", content: "You are a YES or NO decider. You ONLY respond with YES or NO" },
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
      await mongoDBService.getCollection("messages").insertOne({
        chatId,
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
    await bot.sendChatAction(chatId, 'typing');

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
    await mongoDBService.getCollection("messages").insertOne({
      chatId,
      role: 'assistant',
      content: [{ type: "text", text: aiResponse }],
      timestamp: Date.now()
    });

    return { text: aiResponse, imageUrl };
  } catch (error) {
    console.error('Error in handleText:', error);
    throw error;
  }
}

// Export the state object
export { state };
