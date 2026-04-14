const mongoose = require('mongoose');

const barcodeProductSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    min: 0
  },
  weight: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('BarcodeProduct', barcodeProductSchema);
