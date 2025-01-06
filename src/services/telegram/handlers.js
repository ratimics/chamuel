import { CONFIG, SYSTEM_PROMPT } from '../../config/index.js';
import { generateImage, downloadImage } from '../../utils/imageGenerator.js';

import { XService } from '../x/xService.js';

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
const X_POST_CHANCE = 1.0;
let lastPostTime = 0;
let lastImageTime = 0;
let rateLimited = false;

import mongoDBService from '../mongodb/mongodb.js';

const lastMessageDecisions = {};
// Revised handleText to process accumulated messages
import { MetaplexStorageService } from '../storage/metaplexStorage.js';
import { getWallet } from '../../config/wallet.js';

// Initialize Metaplex service with wallet
const wallet = getWallet();
console.log('Wallet:', wallet.publicKey.toString());
const metaplexStorage = new MetaplexStorageService(wallet);

import { retry } from '../../utils/retry.js';

// Helper function for NFT creation
async function createArtNFT(imageBuffer, metadata, tweet = null) {
  try {
    const imageMetadata = {
      name: metadata.name,
      description: metadata.description,
      attributes: [
        ...metadata.attributes,
        { trait_type: 'Type', value: 'Art' },
        ...(tweet ? [{
          trait_type: 'Tweet',
          value: tweet.url
        }] : [])
      ],
      properties: {
        files: [{
          type: 'image/png',
          uri: '' // Will be set after upload
        }],
        ...(tweet && {
          tweet: {
            text: tweet.text,
            url: tweet.url
          }
        })
      }
    };

    const nft = await metaplexStorage.createImageNFT(imageBuffer, imageMetadata);

    return `https://solscan.io/token/${nft.address.toString()}`;
  } catch (error) {
    console.error('NFT creation failed:', error);
    return null;
  }
}

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
    let filePath = null;
    let imageDescription = null;
    let stylePrompt;
    let nftMintUrl = null;

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
      const postOnX = !rateLimited && Math.random() < X_POST_CHANCE && (Date.now() - lastPostTime > XPOST_INTERVAL);
      lastImageTime = Date.now();

      // Generate image with retry mechanism
      const imagePrompt = await getLLMPrompt(combinedMessages);
      const imageUrl = await retry(
        () => generateImage(
          imagePrompt + "\n\n" + stylePrompt,
          CONFIG.AI.CUSTOM_IMAGE_MODEL
        ), 3
      );

      
    console.log('Generated image URL:', imageUrl.toString());
    const imageBuffer = await downloadImage(imageUrl.toString());

      if (!imageBuffer) {
        throw new Error('Failed to generate image after retries');
      }

      // Save and upload image
      filePath = `./images/${randomUUID()}.png`;
      await fs.writeFile(filePath, imageBuffer);

      try {
        imageUrl = await uploadImage(filePath);
        console.log('Uploaded image:', imageUrl);

        let tweetData = null;
        if (postOnX) {
          lastPostTime = Date.now();

          // Generate tweet text
          const tweetResponse = await openai.chat.completions.create({
            model: CONFIG.AI.TEXT_MODEL,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "assistant", content: `I generated an image with prompt: ${imagePrompt}` },
              { role: "user", content: "Write a tweet to go along with the image you generated." }
            ],
            max_tokens: 128,
            temperature: 0.8,
          });

          const tweetText = tweetResponse.choices[0].message.content.trim();

          // Post to X with retry
          const tweetResult = await retry(
            () => XService.post({ text: tweetText }, '', imageBuffer),
            2
          );

          if (!tweetResult) {
            return;
          }

          if (tweetResult?.id) {
            tweetData = {
              text: tweetText,
              url: `https://x.com/bobthesnek/status/${tweetResult.id}`
            };
            // Create NFT with all metadata
            nftMintUrl = await createArtNFT(imageBuffer, {
              name: `Bob's Art: ${randomUUID()}`,
              description: imagePrompt,
              attributes: [
                { trait_type: 'prompt', value: imagePrompt },
                { trait_type: 'style', value: stylePrompt },
                { trait_type: 'xpost', value: `https://x.com/bobthesnek/status/${tweetResult.id}` }
              ]
            });
          }
        }
      } catch (error) {
        console.error('Error in image processing:', error);
        // Continue execution even if NFT creation fails
      }

      imageDescription = `Generated image based on prompt: ${imagePrompt}`;

      // Add to history
      await mongoDBService.getCollection("messages").insertOne({
        chatId,
        role: 'assistant',
        content: [{
          type: "image_description",
          text: imageDescription,
          nftMint: nftMintUrl
        }],
        timestamp: Date.now()
      });
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
    const finalResponse = nftMintUrl
      ? `${aiResponse}\n\nMint my art as NFT: ${nftMintUrl}`
      : aiResponse;

    // Add AI response to history
    await mongoDBService.getCollection("messages").insertOne({
      chatId,
      role: 'assistant',
      content: [{ type: "text", text: finalResponse }],
      timestamp: Date.now()
    });

    return { text: finalResponse, imageUrl, filePath };
  } catch (error) {
    console.error('Error in handleText:', error);
    // Return a graceful error response
    return {
      text: "Oops, something went wrong while processing that. Try again later! 🐍",
      error: error.message
    };
  }
}

// Export the state object
export { state };
