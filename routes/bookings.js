const express = require('express');
const { body, validationResult, query } = require('express-validator');
const ParkingSpace = require('../models/ParkingSpace');
const {
  authenticateToken,
  requireRole,
  requireOwnershipOrAdmin
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/parking-spaces
// @desc    Get all parking spaces with optional filters
// @access  Public
router.get('/', [
  query('city').optional().trim(),
  query('available').optional().isBoolean(),
], async (req, res) => {
  try {
    const filters = {};
    if (req.query.city) filters.city = req.query.city;
    if (req.query.available !== undefined) filters.available = req.query.available === 'true';

    const spaces = await ParkingSpace.find(filters);
    res.json(spaces);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST /api/parking-spaces
// @desc    Create a parking space
// @access  Private (owner or admin)
router.post('/', [
  authenticateToken,
  requireRole(['owner', 'admin']),
  body('location').notEmpty().withMessage('Location is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('pricePerHour').isFloat({ min: 0 }).withMessage('Valid price per hour is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const parkingSpace = new ParkingSpace({
      ...req.body,
      owner: req.user.id
    });
    await parkingSpace.save();
    res.status(201).json(parkingSpace);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create parking space' });
  }
});

// @route   GET /api/parking-spaces/owner/my-spaces
// @desc    Get parking spaces owned by logged-in owner
// @access  Private (owner or admin)
router.get('/owner/my-spaces', authenticateToken, requireRole(['owner', 'admin']), async (req, res) => {
  try {
    const spaces = await ParkingSpace.find({ owner: req.user.id });
    res.json(spaces);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user parking spaces' });
  }
});

// @route   PUT /api/parking-spaces/:id
// @desc    Update a parking space
// @access  Private (owner or admin)
router.put('/:id', authenticateToken, requireOwnershipOrAdmin(ParkingSpace), async (req, res) => {
  try {
    const updated = await ParkingSpace.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update parking space' });
  }
});

// @route   DELETE /api/parking-spaces/:id
// @desc    Delete a parking space
// @access  Private (owner or admin)
router.delete('/:id', authenticateToken, requireOwnershipOrAdmin(ParkingSpace), async (req, res) => {
  try {
    const deleted = await ParkingSpace.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Parking space deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete parking space' });
  }
});

// @route   GET /api/parking-spaces/:id
// @desc    Get parking space by ID
// @access  Public

router.get('/:id', async (req, res) => {
  try {
    const space = await ParkingSpace.findById(req.params.id);
    if (!space) return res.status(404).json({ error: 'Parking space not found' });
    res.json(space);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
