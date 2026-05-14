const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'hidden'], default: 'pending' }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
