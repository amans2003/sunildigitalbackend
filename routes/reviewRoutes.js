const express = require('express');
const router = express.Router();
const {
    createReview,
    getListingReviews,
    updateReviewStatus,
    getAllReviewsAdmin,
} = require('../controllers/reviewController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, admin, getAllReviewsAdmin)
    .post(protect, createReview);

router.get('/:listingId', getListingReviews);

router.put('/:id/status', protect, admin, updateReviewStatus);

module.exports = router;
