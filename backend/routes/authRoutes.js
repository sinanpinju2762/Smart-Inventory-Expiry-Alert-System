const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, adminOnly, managerOrAdmin } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, store } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // First user becomes admin automatically, rest become staff
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'staff';

    const user = await User.create({ name, email, password, role, store });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      store: user.store,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/auth/users/:id/role — Admin changes user role and/or store
router.put('/users/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const { role, store } = req.body;
    const updateData = {};
    if (role) {
      if (!['admin', 'manager', 'staff'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      updateData.role = role;
    }
    if (store !== undefined) {
      updateData.store = store || null;
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('store', 'name').select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/auth/users — Admin gets all users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().populate('store', 'name').select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/auth/users/:id/store — Admin assigns user to a store
router.put('/users/:id/store', protect, adminOnly, async (req, res) => {
  try {
    const { store } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { store }, { new: true })
      .populate('store', 'name').select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/auth/team — Manager gets staff in their store
router.get('/team', protect, async (req, res) => {
  try {
    const fullUser = await User.findById(req.user._id);
    if (!fullUser.store) {
      return res.json([]);
    }
    const team = await User.find({ store: fullUser.store, _id: { $ne: req.user._id } })
      .populate('store', 'name').select('-password').sort({ role: 1, name: 1 });
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/team/add — Manager adds new staff to their store
router.post('/team/add', protect, managerOrAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const fullUser = await User.findById(req.user._id);

    if (!fullUser.store) {
      return res.status(400).json({ message: 'You are not assigned to any store' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const staff = await User.create({
      name,
      email,
      password,
      role: 'staff',
      store: fullUser.store
    });

    const populated = await User.findById(staff._id).populate('store', 'name').select('-password');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/auth/team/:id/remove — Manager removes staff from their store
router.put('/team/:id/remove', protect, managerOrAdmin, async (req, res) => {
  try {
    const fullUser = await User.findById(req.user._id);
    const staff = await User.findById(req.params.id);

    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    if (String(staff.store) !== String(fullUser.store)) {
      return res.status(403).json({ message: 'This staff is not in your store' });
    }
    if (staff.role !== 'staff') {
      return res.status(403).json({ message: 'You can only remove staff members' });
    }

    staff.store = null;
    staff.assignedCategories = [];
    await staff.save();

    res.json({ message: `${staff.name} removed from store` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/auth/team/:id/assign — Manager/Admin assigns work categories to staff
router.put('/team/:id/assign', protect, managerOrAdmin, async (req, res) => {
  try {
    const { categories } = req.body;
    const staff = await User.findById(req.params.id);

    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    // Manager can only assign to their own store staff
    if (req.user.role === 'manager') {
      const fullUser = await User.findById(req.user._id);
      if (String(staff.store) !== String(fullUser.store)) {
        return res.status(403).json({ message: 'This staff is not in your store' });
      }
    }

    staff.assignedCategories = categories || [];
    await staff.save();

    const updated = await User.findById(staff._id).populate('store', 'name').select('-password');
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('store');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      store: user.store,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('store').select('-password');
  res.json(user);
});

module.exports = router;
