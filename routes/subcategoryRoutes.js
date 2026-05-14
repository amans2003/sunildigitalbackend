const express = require('express');
const router = express.Router();
const {
    createSubcategory,
    getSubcategoriesByCategory,
    getAllSubcategories,
    deleteSubcategory,
    updateSubcategory
} = require('../controllers/subcategoryController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getAllSubcategories)
    .post(protect, admin, createSubcategory);

router.get('/category/:categoryId', getSubcategoriesByCategory);

router.route('/:id')
    .put(protect, admin, updateSubcategory)
    .delete(protect, admin, deleteSubcategory);

module.exports = router;
