import Replicate from 'replicate';
import { CONFIG, SYSTEM_PROMPT } from '../config/index.js';
import OpenAI from 'openai';
import { Buffer } from 'buffer';
import { readFileSync } from 'fs';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.YOUR_SITE_URL,
    "X-Title": process.env.YOUR_SITE_NAME,
  }
});

// Initialize Replicate with your API token
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function downloadImage(url) {
  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`Failed to get '${url}' (${response.status})`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer;
  } catch (error) {
      throw new Error('Error downloading the image: ' + error.message);
  }
}

// Generate an image based on a provided prompt using Replicate
export async function generateImage(prompt, model = CONFIG.AI.IMAGE_MODEL) {
  try {
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Invalid prompt provided for image generation.');
    }
  
    // Define the input parameters for the model
    const input = {
      prompt: prompt + `\n\n ${CONFIG.AI.CUSTOM_PROMPT[model] || ''}`,
      // You can adjust other parameters based on the model's requirements
      width: 512,
      height: 512,
      output_format: "png",
    };

    // Get the temporary URL from Replicate
    const output = await replicate.run(model, { input });

    const imageUrl = output.url ? output.url() : [output];

    console.log('Generated image URL:', imageUrl.toString());
    const imageBuffer = await downloadImage(imageUrl.toString());
    return imageBuffer;
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}
export async function getLLMPrompt(history = '') {
  const stylePrompt = readFileSync('./stylePrompt.txt', 'utf-8');
  try {
    const completion = await openai.chat.completions.create({
      model: CONFIG.AI.TEXT_MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT + " You are in a creative mood, and will describe images in detail."
        },
        {
          role: "assistant",
          content: stylePrompt
        },
        {
          role: "user",
          content: `${history}\n\nCome up with a creative and descriptive prompt to use to generate a relevant meme of Bob the Obsequious Snake, use as many words and descriptive phrases as you need.`
        }
      ],
      max_tokens: 256,
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('LLM prompt generation error:', error);
    return "Bob the snake at the beach.";
  }
}

export async function updateStylePrompt(currentStyle, latestImage) {
  try {
    const completion = await openai.chat.completions.create({
      model: CONFIG.AI.VISION_MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT + "\n\nYou are an expert appraiser of artistic styles. You are easily able to analyze the style of an image and generate a detailed, text-based style description to be used as a prompt for future image generation. Ensure that the description is concise, clear, and consistent with the style of the input image."
        },
        {
          "role": "assistant",
          "content": [
            {
              "type": "text",
              "text": "I've been analyzing and generating text-based style descriptions for various images. What would you like me to help you with today?"
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is the current style:
              
              ${currentStyle}
              
              Describe the artistic style of the image below without mentioning any specific elements. This will be appended to future image descriptions and evolve over time, don't include extra commentary.`
            },
            {
              "type": "image_url",
              "image_url": {
                url: latestImage
              }
            }
          ]
        }
      ]
    });
    if (completion.error) {
      throw new Error('Style prompt update error: ' + completion.error.message);
    }
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Style prompt update error:', error);
    return "A vibrant and detailed artistic style.";
  }
}

