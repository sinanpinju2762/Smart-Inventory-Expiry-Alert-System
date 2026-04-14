const express = require('express');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/products — Get all products (filtered by store for non-admin)
router.get('/', protect, async (req, res) => {
  try {
    const { category, status, search, store } = req.query;
    const filter = {};

    // Admin sees all, others see only their store
    if (req.user.role === 'admin' && store) {
      filter.store = store;
    } else if (req.user.role !== 'admin') {
      filter.store = req.user.store;
    }

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .populate('store', 'name')
      .sort({ expiryDate: 1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/dashboard — Dashboard stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    const storeFilter = {};
    if (req.user.role !== 'admin') {
      storeFilter.store = req.user.store;
    } else if (req.query.store) {
      storeFilter.store = req.query.store;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    const [totalProducts, expiringSoon, expired, categoryStats] = await Promise.all([
      Product.countDocuments({ ...storeFilter, quantity: { $gt: 0 } }),
      Product.countDocuments({
        ...storeFilter,
        expiryDate: { $gte: today, $lte: in7Days },
        quantity: { $gt: 0 }
      }),
      Product.countDocuments({
        ...storeFilter,
        expiryDate: { $lt: today },
        quantity: { $gt: 0 }
      }),
      Product.aggregate([
        { $match: { ...storeFilter, quantity: { $gt: 0 } } },
        { $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$price', '$quantity'] } } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const safeProducts = totalProducts - expiringSoon - expired;

    res.json({
      totalProducts,
      safeProducts,
      expiringSoon,
      expired,
      categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/alerts — Get expiring & expired products
router.get('/alerts', protect, async (req, res) => {
  try {
    const storeFilter = {};
    if (req.user.role !== 'admin') {
      storeFilter.store = req.user.store;
    } else if (req.query.store) {
      storeFilter.store = req.query.store;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alertDays = parseInt(req.query.days) || 7;
    const alertDate = new Date(today);
    alertDate.setDate(alertDate.getDate() + alertDays);

    const alerts = await Product.find({
      ...storeFilter,
      expiryDate: { $lte: alertDate },
      quantity: { $gt: 0 }
    })
      .populate('store', 'name')
      .sort({ expiryDate: 1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/products — Add new product
router.post('/', protect, async (req, res) => {
  try {
    // Get user's store - for manager/staff, use their assigned store
    let storeId = req.body.store;
    if (req.user.role !== 'admin') {
      const fullUser = await require('../models/User').findById(req.user._id);
      storeId = fullUser.store;
      if (!storeId) {
        return res.status(400).json({ message: 'You are not assigned to any store. Ask admin to assign you.' });
      }
    }

    const productData = {
      ...req.body,
      addedBy: req.user._id,
      store: storeId
    };

    // Calculate status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(productData.expiryDate);
    const daysUntil = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) productData.status = 'expired';
    else if (daysUntil <= 7) productData.status = 'expiring_soon';
    else productData.status = 'safe';

    const product = await Product.create(productData);
    const populated = await product.populate('store', 'name');

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/products/:id — Update product
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Recalculate status if expiryDate changed
    if (req.body.expiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(req.body.expiryDate);
      const daysUntil = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) req.body.status = 'expired';
      else if (daysUntil <= 7) req.body.status = 'expiring_soon';
      else req.body.status = 'safe';
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('store', 'name');

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/products/:id — Delete product
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
