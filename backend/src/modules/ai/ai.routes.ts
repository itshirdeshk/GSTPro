import { Router } from 'express';
import { AIController } from './ai.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/chat', authenticate as any, AIController.chat);

export default router;
