const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique subcategory name within the same parent category
subcategorySchema.index({ name: 1, parentCategory: 1 }, { unique: true });

const Subcategory = mongoose.model('Subcategory', subcategorySchema);
module.exports = Subcategory;
