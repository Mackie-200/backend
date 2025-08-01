const mongoose = require('mongoose');

const parkingSpaceSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  },
  pricing: {
    hourly: {
      type: Number,
      required: true,
      min: 0
    },
    daily: {
      type: Number,
      min: 0
    },
    monthly: {
      type: Number,
      min: 0
    }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    schedule: {
      monday: { start: String, end: String, available: { type: Boolean, default: true } },
      tuesday: { start: String, end: String, available: { type: Boolean, default: true } },
      wednesday: { start: String, end: String, available: { type: Boolean, default: true } },
      thursday: { start: String, end: String, available: { type: Boolean, default: true } },
      friday: { start: String, end: String, available: { type: Boolean, default: true } },
      saturday: { start: String, end: String, available: { type: Boolean, default: true } },
      sunday: { start: String, end: String, available: { type: Boolean, default: true } }
    }
  },
  features: {
    covered: { type: Boolean, default: false },
    security: { type: Boolean, default: false },
    electricCharging: { type: Boolean, default: false },
    handicapAccessible: { type: Boolean, default: false },
    cameraMonitoring: { type: Boolean, default: false },
    lighting: { type: Boolean, default: false }
  },
  vehicleTypes: [{
    type: String,
    enum: ['car', 'motorcycle', 'truck', 'van', 'rv', 'bicycle'],
    default: 'car'
  }],
  maxVehicleSize: {
    length: Number, // in feet
    width: Number,  // in feet
    height: Number  // in feet
  },
  images: [{
    url: String,
    caption: String
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'pending'
  },
  instructions: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for geospatial queries
parkingSpaceSchema.index({ 'location.coordinates': '2dsphere' });

// Index for search optimization
parkingSpaceSchema.index({ 'location.city': 1, 'status': 1 });
parkingSpaceSchema.index({ 'pricing.hourly': 1 });

module.exports = mongoose.model('ParkingSpace', parkingSpaceSchema);
