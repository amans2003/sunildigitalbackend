const express = require('express');
const router = express.Router();
const { sendMessage, getMessages } = require('../controllers/messageController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/', sendMessage);
router.get('/', protect, admin, getMessages);

module.exports = router;
