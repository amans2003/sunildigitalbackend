const Listing = require('../models/Listing');
const mongoose = require('mongoose');

// @desc    Get all approved listings
// @route   GET /api/listings
// @access  Public
const getListings = async (req, res) => {
    const { keyword, category, subcategory, location, city, state, rating, sortBy, order, limit } = req.query;

    let query = { status: 'approved' };

    if (keyword) {
        query.title = { $regex: keyword, $options: 'i' };
    }

    if (category) {
        query.categoryId = category;
    }
    
    if (subcategory) {
        query.subcategoryId = subcategory;
    }

    if (rating) {
        query.averageRating = { $gte: Number(rating) };
    }

    if (city) {
        query['location.city'] = { $regex: city, $options: 'i' };
    }

    if (state) {
        query['location.state'] = { $regex: state, $options: 'i' };
    }

    // Fallback for combined location string
    if (location && !city && !state) {
        query.$or = [
            { 'location.city': { $regex: location, $options: 'i' } },
            { 'location.address': { $regex: location, $options: 'i' } }
        ];
    }

    try {
        let sortOption = {};
        if (sortBy) {
            sortOption[sortBy] = order === 'asc' ? 1 : -1;
        } else {
            sortOption = { createdAt: -1 }; // Default: Newest first
        }

        const listings = await Listing.find(query)
            .populate('categoryId', 'name')
            .populate('subcategoryId', 'name')
            .populate('vendorId', 'name')
            .sort(sortOption)
            .limit(limit ? parseInt(limit) : 0);
            
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get listing by ID
// @route   GET /api/listings/:id
// @access  Public
const getListingById = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('categoryId', 'name')
            .populate('subcategoryId', 'name')
            .populate('vendorId', 'name');

        if (listing) {
            res.json(listing);
        } else {
            res.status(404).json({ message: 'Listing not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a listing (Vendor submission)
// @route   POST /api/listings
// @access  Private/Vendor/Admin
const createListing = async (req, res) => {
    try {
        const { title, description, categoryId, subcategoryId } = req.body;

        if (!title || !description || !categoryId) {
            return res.status(400).json({ message: 'Title, Description, and Category are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid Category ID' });
        }

        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        // Parse location safely from body
        let rawLocation = { address: 'N/A', city: '', state: '', coordinates: [0, 0] };
        if (req.body.location) {
            if (typeof req.body.location === 'string') {
                try {
                    rawLocation = JSON.parse(req.body.location);
                } catch (e) {
                    rawLocation = { address: req.body.location, coordinates: [0, 0] };
                }
            } else {
                rawLocation = req.body.location;
            }
        }

        // Sanitize coordinates — replace NaN with 0
        let longitude = 0;
        let latitude = 0;
        if (rawLocation.coordinates && Array.isArray(rawLocation.coordinates)) {
            longitude = parseFloat(rawLocation.coordinates[0]);
            latitude = parseFloat(rawLocation.coordinates[1]);
        }
        longitude = isNaN(longitude) ? 0 : longitude;
        latitude = isNaN(latitude) ? 0 : latitude;

        // Explicit range check
        if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
            return res.status(400).json({ message: 'Invalid coordinates. Longitude must be between -180 and 180, and Latitude must be between -90 and 90.' });
        }

        const listingData = {
            title,
            description,
            vendorId: req.user._id,
            categoryId,
            location: {
                address: rawLocation.address || 'N/A',
                city: rawLocation.city || '',
                state: rawLocation.state || ''
            },
            geo: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            contact: {},
            images,
            status: req.user.role === 'admin' ? 'approved' : 'pending',
            specificDetails: {}
        };

        // Parse specificDetails safely
        if (req.body.specificDetails) {
            if (typeof req.body.specificDetails === 'string') {
                try {
                    listingData.specificDetails = JSON.parse(req.body.specificDetails);
                } catch (e) {
                    listingData.specificDetails = {};
                }
            } else {
                listingData.specificDetails = req.body.specificDetails;
            }
        }

        // Parse contact safely
        if (req.body.contact) {
            let parsedContact = {};
            if (typeof req.body.contact === 'string') {
                try {
                    parsedContact = JSON.parse(req.body.contact);
                } catch (e) {
                    parsedContact = {};
                }
            } else {
                parsedContact = req.body.contact;
            }
            listingData.contact = {
                phone: parsedContact.phone || '',
                email: parsedContact.email || '',
                website: parsedContact.website || ''
            };
        }

        // Only attach subcategoryId if it's a valid non-empty ObjectId string
        if (subcategoryId && subcategoryId.trim() !== '' && mongoose.Types.ObjectId.isValid(subcategoryId)) {
            listingData.subcategoryId = subcategoryId;
        }

        const listing = new Listing(listingData);
        const createdListing = await listing.save();
        res.status(201).json(createdListing);
    } catch (error) {
        console.error('Create listing error Details:', error);
        // Distinguish between validation errors and server errors
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Server error while creating listing' });
    }
};

// @desc    Update listing (Vendor/Admin)
// @route   PUT /api/listings/:id
// @access  Private/Vendor
const updateListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (listing) {
            // Check ownership
            if (listing.vendorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized to update this listing' });
            }

            const { title, description, categoryId, subcategoryId, location, contact, status, existingImages, specificDetails } = req.body;

            listing.title = title || listing.title;
            listing.description = description || listing.description;
            listing.categoryId = categoryId || listing.categoryId;
            listing.subcategoryId = subcategoryId || listing.subcategoryId;
            
            if (specificDetails) {
                listing.specificDetails = typeof specificDetails === 'string' ? JSON.parse(specificDetails) : specificDetails;
                listing.markModified('specificDetails');
            }
            
            if (location) {
                const parsedLoc = typeof location === 'string' ? JSON.parse(location) : location;
                listing.location = {
                    address: parsedLoc.address || listing.location.address,
                    city: parsedLoc.city || listing.location.city,
                    state: parsedLoc.state || listing.location.state
                };
                listing.markModified('location');

                if (parsedLoc.coordinates && Array.isArray(parsedLoc.coordinates)) {
                    let lng = parseFloat(parsedLoc.coordinates[0]);
                    let lat = parseFloat(parsedLoc.coordinates[1]);
                    lng = isNaN(lng) ? 0 : lng;
                    lat = isNaN(lat) ? 0 : lat;

                    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
                        return res.status(400).json({ message: 'Invalid coordinates. Longitude must be between -180 and 180, and Latitude must be between -90 and 90.' });
                    }

                    listing.geo = {
                        type: 'Point',
                        coordinates: [lng, lat]
                    };
                    listing.markModified('geo');
                }
            }
            if (contact) {
                const parsedContact = typeof contact === 'string' ? JSON.parse(contact) : contact;
                listing.contact = {
                    phone: parsedContact.phone || listing.contact.phone || '',
                    email: parsedContact.email || listing.contact.email || '',
                    website: parsedContact.website || listing.contact.website || ''
                };
                listing.markModified('contact');
            }

            // Only admin can change status directly to approved
            if (req.user.role === 'admin' && status) {
                listing.status = status;
                listing.markModified('status');
            } else if (listing.vendorId.toString() === req.user._id.toString() && status === 'hidden') {
                listing.status = 'hidden';
                listing.markModified('status');
            }

            // Handle Images
            let currentImages = [];
            if (existingImages) {
                const rawImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
                // Extract and normalize paths
                currentImages = rawImages.map(img => {
                    // If it's a Cloudinary URL, preserve the full URL
                    if (img.includes('res.cloudinary.com')) {
                        return img;
                    }

                    let path = img;
                    if (img.startsWith('http')) {
                        try {
                            const url = new URL(img);
                            // If it's our local server, get the path. Otherwise keep full URL.
                            if (url.host.includes('localhost')) {
                                path = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
                            } else {
                                return img;
                            }
                        } catch (e) {
                            path = img;
                        }
                    }
                    return path.replace(/\\/g, '/');
                });
            } else if (req.body.existingImages === undefined) {
                // If the field wasn't sent at all (e.g. old client), keep all
                currentImages = listing.images; 
            } else {
                // Sent but empty (all deleted)
                currentImages = [];
            }

            if (req.files && req.files.length > 0) {
                const newImages = req.files.map(file => file.path.replace(/\\/g, '/'));
                listing.images = [...currentImages, ...newImages];
            } else {
                listing.images = currentImages;
            }

            const updatedListing = await listing.save();
            res.json(updatedListing);
        } else {
            res.status(404).json({ message: 'Listing not found' });
        }
    } catch (error) {
        console.error('Update listing error Details:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete listing
// @route   DELETE /api/listings/:id
// @access  Private/Admin
const deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (listing) {
             // Check ownership or admin
             if (listing.vendorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized to delete this listing' });
            }
            await listing.deleteOne();
            res.json({ message: 'Listing removed' });
        } else {
            res.status(404).json({ message: 'Listing not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all listings for admin (including pending)
// @route   GET /api/listings/admin
// @access  Private/Admin
const getAdminListings = async (req, res) => {
    try {
        const listings = await Listing.find({})
            .populate('categoryId', 'name')
            .populate('subcategoryId', 'name')
            .populate('vendorId', 'name');
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
    getAdminListings,
};
