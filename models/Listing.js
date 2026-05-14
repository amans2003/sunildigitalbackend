const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
    location: {
        address: { type: String, required: true },
        city: { type: String },
        state: { type: String }
    },
    geo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { 
            type: [Number], 
            default: [0, 0],
            validate: {
                validator: function(v) {
                    if (!Array.isArray(v) || v.length !== 2) return false;
                    const [lng, lat] = v;
                    return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
                },
                message: props => `${props.value} is not a valid coordinate pair! Longitude must be between -180 and 180, and Latitude must be between -90 and 90.`
            }
        } // [longitude, latitude]
    },
    contact: {
        phone: { type: String },
        email: { type: String },
        website: { type: String }
    },
    images: { type: [String], default: [] },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'hidden'], default: 'pending' },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    specificDetails: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

listingSchema.index({ geo: '2dsphere' });


const Listing = mongoose.model('Listing', listingSchema);
module.exports = Listing;
