// ----------------------------------------------------
// region: Imports & Constants
// ----------------------------------------------------
import { randomUUID } from 'crypto';
import { updateMemory } from '../memory/memoryService.js';

import {
  MessageService,
  DecisionService,
  MediaService,
  ResponseService,
  XService,
  NFTService
} from './index.js';

// In-memory state
const state = {
  timers: {}
};
let lastPostTime = 0;
let lastImageTime = 0;
const lastMessageDecisions = {};
// ----------------------------------------------------
// endregion
// ----------------------------------------------------


// ----------------------------------------------------
// region: Main Orchestrator - handleText
// ----------------------------------------------------
export async function handleText(chatId, openai, bot) {
  console.log(`[handleText] Orchestrator invoked for chatId: ${chatId}`);

  try {
    // 1. Retrieve chat history
    console.log('[handleText] Step 1: Retrieving chat history...');
    const history = await MessageService.fetchChatHistory(chatId);
    console.log(`[handleText] Step 1: Retrieved ${history.length} messages.`);

    if (!history.length) {
      console.log('[handleText] Step 1: No history found, returning null.');
      return null;
    }

    // 2. Avoid reprocessing the same message
    console.log('[handleText] Step 2: Checking for duplicate processing...');
    const latestTimestamp = history[history.length - 1].timestamp;
    if (lastMessageDecisions[chatId] >= latestTimestamp) {
      console.log('[handleText] Step 2: Duplicate message detected, returning null.');
      return null;
    }
    lastMessageDecisions[chatId] = latestTimestamp;

    // 3. Update memory & prune old messages if long
    console.log('[handleText] Step 3: Possibly updating memory if history is large...');
    if (history.length >= 100) {
      console.log('[handleText] Step 3: Updating memory...');
      await updateMemory(history);
      console.log('[handleText] Step 3: Deleting old messages...');
      await MessageService.deleteOldMessages(chatId);
    }

    // 4. Combine messages into a single string
    console.log('[handleText] Step 4: Combining messages...');
    const combinedMessages = MessageService.combineMessages(history);

    // 5. Decision: should Bob respond?
    console.log('[handleText] Step 5: Deciding if Bob should respond...');
    const decider = new DecisionService(openai);
    const shouldRespond = await decider.shouldBobRespond(combinedMessages);
    console.log(`[handleText] Step 5: Bob should respond? ${shouldRespond}`);
    if (!shouldRespond) {
      console.log('[handleText] Step 5: Decided not to respond, returning null.');
      return null;
    }

    // Let user know we're "typing"
    console.log('[handleText] Step 5: Sending "typing" status to the bot...');
    try {
        await bot.sendChatAction(chatId, 'typing');
    } catch (error) {
        console.error(error.message);
    }

    // 6. Decision: Should we generate an image?
    console.log('[handleText] Step 6: Deciding if an image should be generated...');
    let imageUrl = null;
    let imageDescription = null;
    let nftMintUrl = null;
    
    const shouldGenerateImg = await decider.shouldGenerateImage(combinedMessages, lastImageTime);
    console.log(`[handleText] Step 6: Should generate image? ${shouldGenerateImg}`);

    if (shouldGenerateImg) {
      lastImageTime = Date.now();

      try {
        // 6a. Generate the image
        console.log('[handleText] Step 6a: Generating the image...');
        const { buffer, imagePrompt, stylePrompt, type } =
          await MediaService.generateMediaBuffer(combinedMessages);

        console.log('[handleText] Step 6a: Saving image locally...');
        const filePath = await MediaService.saveMediaLocally(buffer, type);

        console.log('[handleText] Step 6a: Uploading image to S3...');
        imageUrl = await MediaService.uploadMediaToS3(filePath);
        imageDescription = `Generated image based on prompt: ${imagePrompt}`;

        // 6b. Maybe post to X
        console.log('[handleText] Step 6b: Checking if we should post to X...');
        const tweetData = await XService.maybePostImage(buffer, openai, imagePrompt, type);
        console.log(`[handleText] Step 6b: tweetData: ${JSON.stringify(tweetData)}`);

        // 6c. If posted to X, also create an NFT
        if (tweetData) {
          console.log('[handleText] Step 6c: Creating NFT...');
          nftMintUrl = await NFTService.createArtNFT(
            imageBuffer,
            {
              name: `Bob's Art: ${randomUUID()}`,
              description: imagePrompt,
              attributes: [
                { trait_type: 'prompt', value: imagePrompt },
                { trait_type: 'style', value: stylePrompt }
              ]
            },
            tweetData
          );
          console.log(`[handleText] Step 6c: NFT minted at: ${nftMintUrl}`);
        }

        // 6d. Store generated image in history
        console.log('[handleText] Step 6d: Storing generated image in message history...');
        await MessageService.storeAssistantMessage(chatId, [
          { type: 'image_description', text: imageDescription, nftMint: nftMintUrl }
        ]);
      } catch (imgError) {
        console.error('[handleText] Step 6: Error during image generation/posting/NFT creation:', imgError);
      }
    }

    // 7. Fetch last 3 tweets from @bobthesnek
    console.log('[handleText] Step 7: Fetching last 3 tweets from @bobthesnek...');
    const tweets = await ResponseService.fetchLastThreeTweets('bobthesnek');
    console.log(`[handleText] Step 7: Fetched ${tweets.length} tweets.`);

    // 8. Build final AI response
    console.log('[handleText] Step 8: Building final AI response...');
    const aiResponse = await ResponseService.buildAiResponse(
      openai,
      combinedMessages,
      tweets,
      imageDescription
    );

    // 9. Add NFT info if available
    console.log('[handleText] Step 9: Preparing final response text...');
    const finalResponse = nftMintUrl
      ? `${aiResponse}\n\nMint my art as NFT: ${nftMintUrl}`
      : aiResponse;

    // 10. Store AI text response
    console.log('[handleText] Step 10: Storing final AI response in DB...');
    await MessageService.storeAssistantMessage(chatId, [{ type: 'text', text: finalResponse }]);

    // 11. Return data to the bot
    console.log('[handleText] Step 11: Returning final data to the caller...');
    return { text: finalResponse, imageUrl };

  } catch (error) {
    // Catch-all error handler
    console.error('[handleText] Caught an error:', error);
    
    // Log stack trace if available
    if (error.stack) {
      console.error('[handleText] Error stack:', error.stack);
    }

    return {
      text: "嘶~ Oops! 出了点问题 something went wrong! *hides under rock embarrassed* 🙈",
      error: error.message
    };
  }
}
// ----------------------------------------------------
// endregion
// ----------------------------------------------------


// ----------------------------------------------------
// region: Export state if needed
// ----------------------------------------------------
export { state };
// ----------------------------------------------------
// endregion
// ----------------------------------------------------
