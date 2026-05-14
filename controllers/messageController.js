const Message = require('../models/Message');

// @desc    Send a message
// @route   POST /api/messages
// @access  Public
const sendMessage = async (req, res) => {
    try {
        const { text, senderName, senderEmail, senderId } = req.body;

        if (!text || !senderName || !senderEmail) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const message = await Message.create({
            sender: senderId || null,
            senderName,
            senderEmail,
            text,
            isAdmin: false // Messages from chatbox are usually from users
        });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all messages for admin
// @route   GET /api/messages
// @access  Private/Admin
const getMessages = async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    sendMessage,
    getMessages
};
