import fs from 'fs/promises';

import { CONFIG } from '../../config/index.js';
import { convertVideoToGif } from '../../utils/convertVideoToGif.js';
import { uploadImage } from '../s3/s3imageService.js';
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

    static async generateVideoBuffer(prompt) {
        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        try {
            // Generate video using Replicate
            const output = await replicate.run("minimax/video-01-live", {
                input: { 
                    prompt: "best quality, 4k, HDR, "+ prompt,
                    prompt_optimizer: true,
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
        const prompt = await getLLMPrompt(combinedMessages);
        const fullPrompt = `${prompt}\n\n${stylePrompt}`;

        if (this.shouldGenerateVideo()) {
            const gifBuffer = await this.generateVideoBuffer(fullPrompt);
            return {
                buffer: gifBuffer,
                prompt,
                stylePrompt,
                type: 'gif'
            };
        } else {
            const imageBuffer = await retry(
                () => generateImage(fullPrompt, CONFIG.AI.CUSTOM_IMAGE_MODEL),
                3
            );

            if (!imageBuffer) {
                throw new Error('Failed to generate image after retries');
            }

            return {
                buffer: imageBuffer,
                prompt,
                stylePrompt,
                type: 'image'
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

    static async process(combinedMessages) {
        const { buffer, prompt, stylePrompt, type } = await this.generateMediaBuffer(combinedMessages);
        const filePath = await this.saveMediaLocally(buffer, type);
        const url = await this.uploadMediaToS3(filePath);
        
        return {
            url,
            prompt,
            stylePrompt,
            type
        };
    }
}
// ----------------------------------------------------
// endregion
// ----------------------------------------------------