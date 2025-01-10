import fs from 'fs/promises';

import { CONFIG } from '../../config/index.js';
import { convertVideoToGif } from '../../utils/convertVideoToGif.js';
import { uploadImage, downloadImage } from '../s3/s3imageService.js';
import { generateImage, getLLMPrompt } from '../../utils/imageGenerator.js';
import { retry } from '../../utils/retry.js';
import { randomUUID } from 'crypto';

import Replicate from 'replicate';

// ----------------------------------------------------
// region: Media Service
// ----------------------------------------------------
const STYLE_PROMPT_FILE = CONFIG.AI.STYLE_PROMPT_FILE || './assets/personality/stylePrompt.txt';
const VIDEO_PROBABILITY = CONFIG.AI.VIDEO_PROBABILITY | 0.2; // 20% chance for video by default

export class MediaService {
    static async getStylePrompt() {
        try {
            await fs.access(STYLE_PROMPT_FILE, fs.constants.F_OK);
        } catch (error) {
            if (error.code === 'ENOENT') {
                const defaultContent = 'A funny meme, signed by "Bob the Snake"';
                await fs.writeFile(STYLE_PROMPT_FILE, defaultContent);
            } else {
                console.error('Error accessing style prompt file:', error);
                throw error;
            }
        }
        return fs.readFile(STYLE_PROMPT_FILE, 'utf-8');
    }

    static shouldGenerateVideo() {
        return Math.random() < VIDEO_PROBABILITY;
    }

    static async generateVideoBuffer(prompt, first_frame_image) {
        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        try {
            // Generate video using Replicate
            const output = await replicate.run("minimax/video-01-live", {
                input: { 
                    prompt: "best quality, 4k, HDR, " + prompt + "\n\n slithery meme format, dynamic motion" ,
                    first_frame_image
                 }
            });

            // Handle FileOutput type from Replicate
            if (!output || !output.toString()) {
                throw new Error('No output received from video generation API');
            }

            // FileOutput should resolve to a URL string when used
            const videoUrl = output.toString();

            // Convert video to GIF
            const gifBuffer = await convertVideoToGif(videoUrl);
            return gifBuffer;

        } catch (error) {
            console.error('Error generating video:', error);
            throw new Error(`Failed to generate video: ${error.message}`);
        }
    }

    static async generateMediaBuffer(combinedMessages) {
        const stylePrompt = await this.getStylePrompt();
        
        const fullPrompt = `Style: ${stylePrompt}
    
        Conversation Context:
        ${combinedMessages}
    
        Create a short description for an animated GIF meme concept that visually captures the context above.`;
    
        const prompt = await getLLMPrompt(fullPrompt);
    
        const imageUrl = await retry(
            () => generateImage(prompt, CONFIG.AI.CUSTOM_IMAGE_MODEL),
            3
        );
    
        if (!imageUrl) {
            throw new Error('Failed to generate image after retries');
        }
    
        if (this.shouldGenerateVideo()) {
            const gifBuffer = await this.generateVideoBuffer(prompt, imageUrl);
            return {
                buffer: gifBuffer,
                prompt,
                stylePrompt,
                type: 'gif'
            };
        } else {
            const filePath = await downloadImage(imageUrl.toString());
            const imageBuffer = await fs.readFile(filePath);
            return {
                type: 'png',
                buffer: imageBuffer,
                stylePrompt,
                prompt
            };
        }
    }
    


    static async saveMediaLocally(buffer, type) {
        const extension = type === 'gif' ? 'gif' : 'png';
        const filePath = `./media/${randomUUID()}.${extension}`;
        await fs.writeFile(filePath, buffer);
        return filePath;
    }

    static async uploadMediaToS3(filePath) {
        const url = await uploadImage(filePath); // Assuming uploadImage works for both images and GIFs
        console.log('Uploaded media:', url);
        return url;
    }
}
// ----------------------------------------------------
// endregion
// ----------------------------------------------------