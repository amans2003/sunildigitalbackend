const express = require('express');
const router = express.Router();
const {
    registerUser,
    authUser,
    getUserProfile,
    toggleWishlist,
    getWishlist,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.post('/wishlist/:id', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);

module.exports = router;
