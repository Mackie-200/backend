const express = require('express');
const { query, body, validationResult } = require('express-validator');
const User = require('../models/User');
const ParkingSpace = require('../models/ParkingSpace');
const Booking = require('../models/Booking');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalParkingSpaces = await ParkingSpace.countDocuments();
    const activeParkingSpaces = await ParkingSpace.countDocuments({ status: 'active' });
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: 'active' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });

    // Revenue calculation (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBookings = await Booking.find({
      createdAt: { $gte: thirtyDaysAgo },
      'payment.status': 'completed'
    });
    
    const monthlyRevenue = recentBookings.reduce((total, booking) => total + booking.pricing.total, 0);

    // Recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    const recentParkingSpaces = await ParkingSpace.find()
      .populate('owner', 'name businessName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title location status createdAt owner');

    res.json({
      success: true,
      data: {
        statistics: {
          users: {
            total: totalUsers,
            owners: totalOwners,
            regular: totalUsers - totalOwners
          },
          parkingSpaces: {
            total: totalParkingSpaces,
            active: activeParkingSpaces,
            inactive: totalParkingSpaces - activeParkingSpaces
          },
          bookings: {
            total: totalBookings,
            active: activeBookings,
            completed: completedBookings
          },
          revenue: {
            monthly: monthlyRevenue,
            averagePerBooking: completedBookings > 0 ? monthlyRevenue / completedBookings : 0
          }
        },
        recentActivity: {
          users: recentUsers,
          parkingSpaces: recentParkingSpaces
        }
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Private (Admin)
router.get('/users', authenticateToken, requireRole('admin'), [
  query('role').optional().isIn(['user', 'owner', 'admin']),
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    let query = {};
    if (role) query.role = role;
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { businessName: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (verify, suspend, etc.)
// @access  Private (Admin)
router.put('/users/:id/status', authenticateToken, requireRole('admin'), [
  body('isVerified').optional().isBoolean(),
  body('role').optional().isIn(['user', 'owner', 'admin'])
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

    const { isVerified, role } = req.body;
    const userId = req.params.id;

    // Prevent admin from modifying their own role
    if (userId === req.user._id.toString() && role !== undefined) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own role'
      });
    }

    const updateData = {};
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (role !== undefined) updateData.role = role;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/parking-spaces
// @desc    Get all parking spaces with filters
// @access  Private (Admin)
router.get('/parking-spaces', authenticateToken, requireRole('admin'), [
  query('status').optional().isIn(['active', 'inactive', 'pending', 'suspended']),
  query('city').optional().trim(),
  query('owner').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const { status, city, owner, page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) query.status = status;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (owner) query.owner = owner;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const parkingSpaces = await ParkingSpace.find(query)
      .populate('owner', 'name businessName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ParkingSpace.countDocuments(query);

    res.json({
      success: true,
      data: {
        parkingSpaces,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get parking spaces error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/parking-spaces/:id/status
// @desc    Update parking space status
// @access  Private (Admin)
router.put('/parking-spaces/:id/status', authenticateToken, requireRole('admin'), [
  body('status').isIn(['active', 'inactive', 'pending', 'suspended']).withMessage('Invalid status'),
  body('reason').optional().trim()
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

    const { status, reason } = req.body;
    const parkingSpaceId = req.params.id;

    const parkingSpace = await ParkingSpace.findByIdAndUpdate(
      parkingSpaceId,
      { status },
      { new: true, runValidators: true }
    ).populate('owner', 'name businessName email');

    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: 'Parking space not found'
      });
    }

    res.json({
      success: true,
      message: `Parking space status updated to ${status}`,
      data: { parkingSpace }
    });

  } catch (error) {
    console.error('Update parking space status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings with filters
// @access  Private (Admin)
router.get('/bookings', authenticateToken, requireRole('admin'), [
  query('status').optional().isIn(['pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show']),
  query('user').optional().isMongoId(),
  query('parkingSpace').optional().isMongoId(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const { status, user, parkingSpace, startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) query.status = status;
    if (user) query.user = user;
    if (parkingSpace) query.parkingSpace = parkingSpace;
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('parkingSpace', 'title location owner')
      .populate('parkingSpace.owner', 'name businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Private (Admin)
router.get('/analytics', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Booking trends
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: "$pricing.total" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Popular locations
    const popularLocations = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'active'] }
        }
      },
      {
        $lookup: {
          from: 'parkingspaces',
          localField: 'parkingSpace',
          foreignField: '_id',
          as: 'space'
        }
      },
      {
        $unwind: '$space'
      },
      {
        $group: {
          _id: '$space.location.city',
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.total' }
        }
      },
      {
        $sort: { bookings: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // User registration trends
    const userTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            role: "$role"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        bookingTrends,
        popularLocations,
        userTrends,
        period: days
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
