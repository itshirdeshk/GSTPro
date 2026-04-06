import { Request, Response } from 'express';
import { AIService } from './ai.service';
import { sendSuccess, sendError } from '../../utils/response';

export class AIController {
  static async chat(req: Request, res: Response) {
    try {
      const { prompt, analyticsData } = req.body;

      if (!prompt) {
        return sendError(res, 'Prompt is required', 400);
      }

      const response = await AIService.getInsights(prompt, analyticsData);
      return sendSuccess(res, { response });
    } catch (error: any) {
      console.error('AI Controller Error:', error);
      return sendError(res, error.message || 'AI service failed');
    }
  }
}
