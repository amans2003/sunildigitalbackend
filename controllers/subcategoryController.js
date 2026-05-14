const Subcategory = require('../models/Subcategory');

// @desc    Create a subcategory
// @route   POST /api/subcategories
// @access  Private/Admin
const createSubcategory = async (req, res) => {
    try {
        const { name, parentCategory } = req.body;
        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        
        const subcategory = await Subcategory.create({
            name,
            slug,
            parentCategory
        });
        res.status(201).json(subcategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get subcategories by category
// @route   GET /api/subcategories/category/:categoryId
// @access  Public
const getSubcategoriesByCategory = async (req, res) => {
    try {
        const subcategories = await Subcategory.find({ 
            parentCategory: req.params.categoryId,
            isActive: true 
        });
        res.json(subcategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all subcategories
// @route   GET /api/subcategories
// @access  Public
const getAllSubcategories = async (req, res) => {
    try {
        const subcategories = await Subcategory.find({}).populate('parentCategory', 'name');
        res.json(subcategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete subcategory
// @route   DELETE /api/subcategories/:id
// @access  Private/Admin
const deleteSubcategory = async (req, res) => {
    try {
        const subcategory = await Subcategory.findById(req.params.id);
        if (subcategory) {
            await subcategory.deleteOne();
            res.json({ message: 'Subcategory removed' });
        } else {
            res.status(404).json({ message: 'Subcategory not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update subcategory
// @route   PUT /api/subcategories/:id
// @access  Private/Admin
const updateSubcategory = async (req, res) => {
    try {
        const { name, parentCategory } = req.body;
        const subcategory = await Subcategory.findById(req.params.id);
        if (subcategory) {
            subcategory.name = name || subcategory.name;
            if (parentCategory) subcategory.parentCategory = parentCategory;
            const updated = await subcategory.save();
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Subcategory not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createSubcategory,
    getSubcategoriesByCategory,
    getAllSubcategories,
    deleteSubcategory,
    updateSubcategory
};
