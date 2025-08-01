const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parkingSpace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSpace',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  vehicleInfo: {
    licensePlate: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    make: {
      type: String,
      trim: true
    },
    model: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['car', 'motorcycle', 'truck', 'van', 'rv', 'bicycle'],
      default: 'car'
    }
  },
  pricing: {
    baseRate: {
      type: Number,
      required: true
    },
    totalHours: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    taxes: {
      type: Number,
      default: 0
    },
    fees: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay'],
      required: true
    },
    transactionId: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: {
      type: Date
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  checkIn: {
    time: Date,
    method: {
      type: String,
      enum: ['qr_code', 'manual', 'automatic'],
      default: 'qr_code'
    },
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  checkOut: {
    time: Date,
    method: {
      type: String,
      enum: ['qr_code', 'manual', 'automatic'],
      default: 'qr_code'
    },
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    ratedAt: Date
  },
  notes: {
    user: {
      type: String,
      trim: true
    },
    owner: {
      type: String,
      trim: true
    },
    admin: {
      type: String,
      trim: true
    }
  },
  qrCode: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
bookingSchema.index({ user: 1, startTime: -1 });
bookingSchema.index({ parkingSpace: 1, startTime: 1 });
bookingSchema.index({ status: 1, startTime: 1 });
bookingSchema.index({ qrCode: 1 });

// Check for overlapping bookings
bookingSchema.statics.checkAvailability = async function(parkingSpaceId, startTime, endTime, excludeBookingId = null) {
  const query = {
    parkingSpace: parkingSpaceId,
    status: { $in: ['confirmed', 'active'] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  const conflictingBooking = await this.findOne(query);
  return !conflictingBooking;
};

// Generate unique QR code
bookingSchema.methods.generateQRCode = function() {
  const crypto = require('crypto');
  this.qrCode = crypto.randomBytes(16).toString('hex');
  return this.qrCode;
};

// Calculate total duration in hours
bookingSchema.virtual('durationHours').get(function() {
  return Math.ceil((this.endTime - this.startTime) / (1000 * 60 * 60));
});

module.exports = mongoose.model('Booking', bookingSchema);
