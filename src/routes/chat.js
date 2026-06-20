import express from 'express';
import { createConversation, getConversationMessages, getUserConversations, markMessageAsSeen } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticate, createConversation);
router.get('/:conversationId/messages', authenticate, getConversationMessages);
router.get('/user/conversations', authenticate, getUserConversations);
router.put('/messages/:messageId/seen', authenticate, markMessageAsSeen);

export default router;
