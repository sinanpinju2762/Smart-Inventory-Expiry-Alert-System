const express = require('express');
const Store = require('../models/Store');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/stores — Get all stores
router.get('/', protect, async (req, res) => {
  try {
    const stores = await Store.find({ isActive: true }).sort({ name: 1 });
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/stores/summary — Get all stores with product stats (admin)
router.get('/summary', protect, adminOnly, async (req, res) => {
  try {
    const stores = await Store.find({ isActive: true });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    const summary = await Promise.all(stores.map(async (store) => {
      const [total, expiring, expired, totalValue, employees, managerUser] = await Promise.all([
        Product.countDocuments({ store: store._id, quantity: { $gt: 0 } }),
        Product.countDocuments({ store: store._id, expiryDate: { $gte: today, $lte: in7Days }, quantity: { $gt: 0 } }),
        Product.countDocuments({ store: store._id, expiryDate: { $lt: today }, quantity: { $gt: 0 } }),
        Product.aggregate([
          { $match: { store: store._id, quantity: { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: { $multiply: ['$price', '$quantity'] } } } }
        ]),
        User.countDocuments({ store: store._id }),
        User.findOne({ store: store._id, role: 'manager' }).select('name email')
      ]);

      return {
        ...store.toJSON(),
        totalProducts: total,
        expiringSoon: expiring,
        expiredProducts: expired,
        totalValue: totalValue[0]?.total || 0,
        employeeCount: employees,
        managerName: managerUser?.name || 'Not assigned',
        managerEmail: managerUser?.email || ''
      };
    }));

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/stores — Create store (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const store = await Store.create(req.body);
    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/stores/:id — Update store (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.json(store);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/stores/:id — Deactivate store (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.json({ message: 'Store deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
