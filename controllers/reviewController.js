const Review = require('../models/Review');
const Listing = require('../models/Listing');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
    const { listingId, rating, comment } = req.body;

    try {
        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        const reviewExists = await Review.findOne({
            userId: req.user._id,
            listingId,
        });

        if (reviewExists) {
            return res.status(400).json({ message: 'Listing already reviewed' });
        }

        const review = await Review.create({
            userId: req.user._id,
            listingId,
            rating: Number(rating),
            comment,
            status: 'pending', // Moderation
        });

        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get reviews for a listing
// @route   GET /api/reviews/:listingId
// @access  Public
const getListingReviews = async (req, res) => {
    try {
        const reviews = await Review.find({
            listingId: req.params.listingId,
            status: 'approved',
        }).populate('userId', 'name');

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update review status (Admin)
// @route   PUT /api/reviews/:id/status
// @access  Private/Admin
const updateReviewStatus = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (review) {
            review.status = req.body.status || review.status;
            const updatedReview = await review.save();

            // If approved, update listing's average rating
            if (review.status === 'approved') {
                const listing = await Listing.findById(review.listingId);
                const approvedReviews = await Review.find({ listingId: review.listingId, status: 'approved' });
                
                listing.totalReviews = approvedReviews.length;
                listing.averageRating = approvedReviews.reduce((acc, item) => item.rating + acc, 0) / approvedReviews.length;
                
                await listing.save();
            }

            res.json(updatedReview);
        } else {
            res.status(404).json({ message: 'Review not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all reviews for admin
// @route   GET /api/reviews
// @access  Private/Admin
const getAllReviewsAdmin = async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate('userId', 'name')
            .populate('listingId', 'title');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createReview,
    getListingReviews,
    updateReviewStatus,
    getAllReviewsAdmin,
};
