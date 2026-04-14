const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  barcode: {
    type: String,
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Dairy', 'Bakery', 'Beverages', 'Snacks', 'Frozen', 'Canned', 'Personal Care', 'Household', 'Fruits & Vegetables', 'Meat & Seafood', 'Grains & Cereals', 'Condiments', 'Other'],
    default: 'Other'
  },
  brand: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  manufacturingDate: {
    type: Date
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required']
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['safe', 'expiring_soon', 'expired'],
    default: 'safe'
  }
}, { timestamps: true });

// Virtual: days until expiry
productSchema.virtual('daysUntilExpiry').get(function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(this.expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
