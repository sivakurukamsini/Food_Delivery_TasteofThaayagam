import express from 'express';
import { createMessage, listMessages, markAsRead, deleteMessage, unreadCount } from '../controllers/messageController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Public endpoint to create a message
router.post('/', createMessage);
// Public endpoint to get unread messages count (so public site can show notification dot to admins)
router.get('/unread-count', unreadCount);

// Admin endpoints
router.get('/', adminAuth, listMessages);
router.put('/:id/read', adminAuth, markAsRead);
router.delete('/:id', adminAuth, deleteMessage);

export default router;
