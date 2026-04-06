import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export class AIService {
  static async getInsights(prompt: string, analyticsData: any) {
    if (!env.GEMINI_API_KEY) {
      return "AI features are currently unavailable. Please configure GEMINI_API_KEY.";
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      

      const systemPrompt = `
        You are an expert business analyst for "Sales Suite".
        
        STRICT RESPONSE RULES:
        1. BREVITY: Maximum 3-4 bullet points. No long sentences.
        2. FORMAT: Use a NEW LINE for every bullet point starting with '* '.
        3. CURRENCY: Always use Indian Rupees (₹) for all monetary values.
        4. ACCURACY: Use absolute values from the data.
        5. NO FLUFF: No introductions or conclusions.
        6. STYLE: Bold the most important numbers/metrics using **text**.

        Context Data:
        ${JSON.stringify(analyticsData, null, 2)}
      `;

      const result = await model.generateContent([systemPrompt, prompt]);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini AI Error:', error);
      throw new Error('Failed to generate AI insights');
    }
  }
}
