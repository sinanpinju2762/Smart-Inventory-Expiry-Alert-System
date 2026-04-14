const express = require('express');
const BarcodeProduct = require('../models/BarcodeProduct');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/barcode/:code — Look up a barcode
router.get('/:code', protect, async (req, res) => {
  try {
    // First check local database
    const localProduct = await BarcodeProduct.findOne({ barcode: req.params.code });
    if (localProduct) {
      return res.json({ source: 'local', product: localProduct });
    }

    // If not found locally, return not found (frontend can call Open Food Facts API directly)
    res.status(404).json({ message: 'Barcode not found in local database. Try online lookup.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/barcode — Save a barcode product to local database
router.post('/', protect, async (req, res) => {
  try {
    const { barcode, name, brand, category, price, weight } = req.body;

    const existing = await BarcodeProduct.findOne({ barcode });
    if (existing) {
      const updated = await BarcodeProduct.findOneAndUpdate({ barcode }, { name, brand, category, price, weight }, { new: true });
      return res.json(updated);
    }

    const product = await BarcodeProduct.create({ barcode, name, brand, category, price, weight });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
