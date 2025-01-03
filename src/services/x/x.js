import process from 'process';
import { Buffer } from 'buffer';

import sharp from 'sharp';
import { TwitterApi } from 'twitter-api-v2';

const xClient = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_KEY_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

// Enhanced chunking function to split text into tweet-sized chunks prioritizing double line breaks
function chunkText(text, chunkSize = 280) {
    const paragraphs = text.split('\n\n'); // Split text into paragraphs first
    const chunks = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        const lines = paragraph.split('\n'); // Then split into lines within each paragraph

        for (const line of lines) {
            if (currentChunk.length + line.length + 1 > chunkSize) {
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }

                if (line.length > chunkSize) {
                    const words = line.split(' ');
                    for (const word of words) {
                        if (currentChunk.length + word.length + 1 > chunkSize) {
                            chunks.push(currentChunk.trim());
                            currentChunk = word;
                        } else {
                            currentChunk += ` ${word}`;
                        }
                    }
                } else {
                    currentChunk += ` ${line}\n`;
                }
            } else {
                currentChunk += ` ${line}\n`;
            }
        }

        chunks.push(currentChunk.trim());
        currentChunk = '';
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

// Function to delay execution (used for retries)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to upload a single image buffer
async function uploadImageBuffer(imageBuffer, type = 'png') {

    // if the image Buffer exceeds 5242880 bytes (5MB), it will be resized
    while (imageBuffer.length > 5242880) {
        console.log('🌳 Resizing image buffer...');

        // Get image metadata first
        const metadata = await sharp(imageBuffer).metadata();

        // Calculate new dimensions (80% of original)
        const newWidth = Math.floor(metadata.width * 0.8);
        const newHeight = Math.floor(metadata.height * 0.8);

        imageBuffer = await sharp(imageBuffer)
            .resize(newWidth, newHeight)
            .toBuffer();
    }

    try {
        const mediaId = await xClient.v1.uploadMedia(Buffer.from(imageBuffer), { mimeType: `image/${type}` });
        console.log('🌳 Image uploaded successfully:', mediaId);
        return mediaId;
    } catch (error) {
        console.error('🌳 Error uploading image:', error);
        throw error;
    }
}

let rateLimitReset = 0;
// Enhanced function to post tweets with various options, image attachment, and error handling
export async function postX(params, accountId = '', imageBuffer = null, type = 'png') {
    const { text, ...otherParams } = params;
    const tweetChunks = chunkText(text || '');

    if (Date.now() < rateLimitReset) {
        console.log(`🌳 Rate limit exceeded, retrying in ${rateLimitReset} seconds...`);
        return null;
    }

    let inReplyToTweetId = accountId || null;
    const maxRetries = 3;
    let mediaId = null;

    // Upload image if buffer is provided
    if (imageBuffer) {
        try {
            mediaId = await uploadImageBuffer(imageBuffer, type);
        } catch (error) {
            console.error('🌳 Failed to upload image, proceeding without it.');
            console.error(error);
        }
    }

    let index = 0;
    for (const chunk of tweetChunks) {
        let success = false;
        let attempt = 0;

        // Wait for a few seconds between each chunk
        await delay(5000);

        while (attempt < maxRetries && !success) {
            try {
                const tweetPayload = {
                    text: chunk,
                    ...otherParams,
                    reply: inReplyToTweetId ? { in_reply_to_tweet_id: inReplyToTweetId } : undefined,
                };

                // Attach mediaId if available and it's the first chunk
                if (mediaId && index === 0) {
                    tweetPayload.media = { media_ids: [mediaId] };
                }

                const response = await xClient.v2.tweet(tweetPayload);
                console.log('🌳 Tweet posted successfully:', response);

                // Update inReplyToTweetId for the next tweet in the thread
                inReplyToTweetId = response.data.id;
                success = true;
            } catch (error) {
                attempt++;
                console.error(`🌳 Error posting tweet (Attempt ${attempt}/${maxRetries}):`, error);
                if (attempt < maxRetries && error.rateLimit && error.rateLimit.reset) {
                    console.log(`🌳 Rate limit exceeded, retrying in ${error.rateLimit.reset} seconds...`);
                    rateLimitReset = error.rateLimit.reset;
                    break;
                } else {
                    console.error('🌳 Failed to post tweet after multiple attempts. Exiting...');
                    break;
                }
            }
        }

        if (!success) {
            break; // Stop the loop if the tweet couldn't be posted
        }
        
        index++;
    }

    return { id: inReplyToTweetId };
}
