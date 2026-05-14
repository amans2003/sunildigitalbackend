const express = require('express');
const router = express.Router();
const {
    getListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
    getAdminListings,
} = require('../controllers/listingController');
const { protect, admin, vendor } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.route('/')
    .get(getListings)
    .post(protect, vendor, upload.array('images', 5), createListing);

router.get('/admin', protect, admin, getAdminListings);

router.route('/:id')
    .get(getListingById)
    .put(protect, upload.array('images', 5), updateListing)
    .delete(protect, deleteListing);

module.exports = router;
