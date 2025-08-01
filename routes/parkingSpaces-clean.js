const express = require('express');
const { body, validationResult, query } = require('express-validator');
const ParkingSpace = require('../models/ParkingSpace');
const { authenticateToken, requireRole, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Allowed feature names for validation and query
const ALLOWED_FEATURES = [
  'covered',
  'security_camera',
  'lighting',
  'electric_charging',
  'handicap_accessible',
  'car_wash',
  'valet_service'
];

// @route   GET /api/parking-spaces
// @desc    Get all parking spaces with filters
// @access  Public
router.get('/', [
  query('city').optional().trim(),
  query('state').optional().trim(),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('lat').optional().isFloat(),
  query('lng').optional().isFloat(),
  query('radius').optional().isFloat({ min: 0 }),
  query('features').optional(),
  query('vehicleType').optional().isIn(['car', 'motorcycle', 'truck', 'van', 'rv', 'bicycle']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      city,
      state,
      maxPrice,
      minPrice,
      lat,
      lng,
      radius,
      features,
      vehicleType,
      page = 1,
      limit = 10
    } = req.query;

    let query = { status: 'active' };

    // Location filters
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (state) query['location.state'] = new RegExp(state, 'i');

    // Price filters
    if (minPrice || maxPrice) {
      query.pricePerHour = {};
      if (minPrice) query.pricePerHour.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerHour.$lte = parseFloat(maxPrice);
    }

    // Vehicle type filter
    if (vehicleType) {
      query.vehicleTypes = vehicleType;
    }

    // Features filter
    if (features) {
      const requestedFeatures = features.split(',').map(f => f.trim());
      const validFeatures = requestedFeatures.filter(f => ALLOWED_FEATURES.includes(f));
      if (validFeatures.length > 0) {
        query.features = { $in: validFeatures };
      }
    }

    // Geospatial query for nearby parking spaces
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const searchRadius = radius ? parseFloat(radius) : 10; // Default 10km radius

      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: searchRadius * 1000 // Convert km to meters
        }
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const parkingSpaces = await ParkingSpace.find(query)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ParkingSpace.countDocuments(query);

    res.json({
      success: true,
      data: parkingSpaces,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching parking spaces:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/parking-spaces/owner/my-spaces
// @desc    Get parking spaces owned by the authenticated user
// @access  Private (Owner/Admin)
router.get('/owner/my-spaces', authenticateToken, requireRole(['owner', 'admin']), async (req, res) => {
  try {
    const { page = '1', limit = '10', status } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (parsedPage < 1 || parsedLimit < 1 || parsedLimit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    let query = { owner: req.user.id };

    if (status && ['active', 'inactive', 'pending'].includes(status)) {
      query.status = status;
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const parkingSpaces = await ParkingSpace.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const total = await ParkingSpace.countDocuments(query);

    res.json({
      success: true,
      data: parkingSpaces,
      pagination: {
        current: parsedPage,
        pages: Math.ceil(total / parsedLimit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching owner parking spaces:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/parking-spaces
// @desc    Create a new parking space
// @access  Private (Owner/Admin)
router.post('/', authenticateToken, requireRole(['owner', 'admin']), [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.state').trim().notEmpty().withMessage('State is required'),
  body('location.zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be an array of [longitude, latitude]'),
  body('pricePerHour').isFloat({ min: 0 }).withMessage('Price per hour must be a positive number'),
  body('vehicleTypes').isArray({ min: 1 }).withMessage('At least one vehicle type must be specified'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('availability.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('availability.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const parkingSpaceData = {
      ...req.body,
      owner: req.user.id
    };

    const parkingSpace = new ParkingSpace(parkingSpaceData);
    await parkingSpace.save();

    await parkingSpace.populate('owner', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Parking space created successfully',
      data: parkingSpace
    });

  } catch (error) {
    console.error('Error creating parking space:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/parking-spaces/:id
// @desc    Get single parking space
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('reviews.user', 'name');

    if (!parkingSpace) {
      return res.status(404).json({ 
        success: false,
        message: 'Parking space not found' 
      });
    }

    res.json({
      success: true,
      data: parkingSpace
    });
  } catch (error) {
    console.error('Error fetching parking space:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/parking-spaces/:id
// @desc    Update parking space
// @access  Private (Owner/Admin)
router.put('/:id', authenticateToken, requireOwnershipOrAdmin('ParkingSpace'), [
  body('title').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('pricePerHour').optional().isFloat({ min: 0 }),
  body('vehicleTypes').optional().isArray({ min: 1 }),
  body('features').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const parkingSpace = await ParkingSpace.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email phone');

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: 'Parking space not found'
      });
    }

    res.json({
      success: true,
      message: 'Parking space updated successfully',
      data: parkingSpace
    });

  } catch (error) {
    console.error('Error updating parking space:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/parking-spaces/:id
// @desc    Delete parking space
// @access  Private (Owner/Admin)
router.delete('/:id', authenticateToken, requireOwnershipOrAdmin('ParkingSpace'), async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findByIdAndDelete(req.params.id);

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: 'Parking space not found'
      });
    }

    res.json({
      success: true,
      message: 'Parking space deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting parking space:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
