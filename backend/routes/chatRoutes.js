const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middleware/auth');

// IMPORTANT: named routes MUST come BEFORE /:chatId
router.post('/start', auth, chatController.startChat);
router.post('/bot', auth, chatController.chatbot);
router.get('/my-chats', auth, chatController.getMyChats);

// Parameterized routes (must be last)
router.get('/:chatId', auth, chatController.getChatMessages);
router.post('/:chatId/message', auth, chatController.sendMessage);

module.exports = router;
