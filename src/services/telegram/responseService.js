
import mongoDBService from "../mongodb/mongodb.js";

import { CONFIG, SYSTEM_PROMPT } from "../../config/index.js";
// ----------------------------------------------------
// region: Final Response Service
// ----------------------------------------------------
export class ResponseService {
    static async fetchLastThreeTweets(username) {
      const author = await mongoDBService.getCollection('authors').findOne({ username });
      if (!author) return [];
  
      return mongoDBService
        .getCollection('tweets')
        .find({ author_id: author.id })
        .sort({ id: -1 })
        .limit(3)
        .toArray();
    }
  
    static async buildAiResponse(openai, combinedMessages, tweets, imageDescription) {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(tweets.length > 0
          ? [
              {
                role: 'assistant',
                content: `I tweeted from my account @bobthesnek:\n\n${tweets.map(t => t.text).join('\n\n')}`
              }
            ]
          : []),
        ...(imageDescription
          ? [
              {
                role: 'assistant',
                content: `I generated an image: ${imageDescription}`
              }
            ]
          : []),
        {
          role: 'user',
          content:
            combinedMessages + 
            '\n\nRespond naturally as Bob the Snake with one or two SHORT sentences or *actions* '
        }
      ];
  
      const response = await openai.chat.completions.create({
        model: CONFIG.AI.TEXT_MODEL,
        messages,
        max_tokens: 128,
        temperature: 0.8
      });
  
      return response.choices[0]?.message?.content?.trim() || '';
    }
  }
  // ----------------------------------------------------
  // endregion
  // ----------------------------------------------------
  
  // ----------------------------------------------------
// region: Bob's Bilingual Response Builder
// ----------------------------------------------------
export class ResponseBuilder {
    static async buildBobResponse(openai, messages, context = {}) {
        const systemPrompt = `You are Bob (蛇蛇鲍勃), a friendly bilingual snake who speaks both English and Mandarin.
Always mix both languages naturally in your responses, adding "嘶~" occasionally.
Use asterisks for actions like *flicks tongue* or *coils happily*.
Include emojis and keep responses short and playful.
Translate key Chinese phrases when they're important for understanding.
Current conversational context: ${context.situation || 'casual chat'}`;

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: messages }
                ],
                temperature: 0.9,  // Higher creativity
                max_tokens: 150    // Keep responses concise
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Error generating Bob response:', error);
            return "嘶~ Oops! 出了点问题 something went wrong! *hides under rock embarrassed* 🙈";
        }
    }
}
// ----------------------------------------------------
// endregion
// ----------------------------------------------------