import { openai, CONFIG } from '../../config/index.js'; // Import OpenAI instance


export async function describeImage(fileUrl) {
    // Get description from vision model
    const response = await openai.chat.completions.create({
        model: CONFIG.AI.VISION_MODEL,
        messages: [{
            role: "user",
            content: [
                { type: "text", text: "What's in this image? Describe it briefly." },
                { type: "image_url", image_url: { url: fileUrl } }
            ],
        }],
        max_tokens: 100,
    });

    return response;
}