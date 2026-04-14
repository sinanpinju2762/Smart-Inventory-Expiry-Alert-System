const express = require('express');
const Product = require('../models/Product');
const { protect, managerOrAdmin } = require('../middleware/auth');
const { generatePDFReport } = require('../services/pdfGenerator');

const router = express.Router();

// GET /api/reports/monthly — Get monthly expiry report data
router.get('/monthly', protect, managerOrAdmin, async (req, res) => {
  try {
    const { month, year, store } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const storeFilter = {};
    if (req.user.role !== 'admin') {
      storeFilter.store = req.user.store;
    } else if (store) {
      storeFilter.store = store;
    }

    // Products that expired in this month
    const expiredProducts = await Product.find({
      ...storeFilter,
      expiryDate: { $gte: startDate, $lte: endDate },
      status: 'expired'
    }).populate('store', 'name').sort({ expiryDate: 1 });

    // Category breakdown
    const categoryBreakdown = await Product.aggregate([
      {
        $match: {
          ...storeFilter,
          expiryDate: { $gte: startDate, $lte: endDate },
          status: 'expired'
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalLoss: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      { $sort: { totalLoss: -1 } }
    ]);

    const totalLoss = categoryBreakdown.reduce((sum, cat) => sum + cat.totalLoss, 0);
    const totalExpired = expiredProducts.length;

    res.json({
      month: m,
      year: y,
      totalExpired,
      totalLoss,
      expiredProducts,
      categoryBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/monthly/pdf — Download monthly report as PDF
router.get('/monthly/pdf', protect, managerOrAdmin, async (req, res) => {
  try {
    const { month, year, store } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const storeFilter = {};
    if (req.user.role !== 'admin') {
      storeFilter.store = req.user.store;
    } else if (store) {
      storeFilter.store = store;
    }

    const expiredProducts = await Product.find({
      ...storeFilter,
      expiryDate: { $gte: startDate, $lte: endDate },
      status: 'expired'
    }).populate('store', 'name').sort({ expiryDate: 1 });

    const categoryBreakdown = await Product.aggregate([
      {
        $match: {
          ...storeFilter,
          expiryDate: { $gte: startDate, $lte: endDate },
          status: 'expired'
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalLoss: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      { $sort: { totalLoss: -1 } }
    ]);

    const totalLoss = categoryBreakdown.reduce((sum, cat) => sum + cat.totalLoss, 0);

    const reportData = {
      month: m,
      year: y,
      totalExpired: expiredProducts.length,
      totalLoss,
      expiredProducts,
      categoryBreakdown
    };

    const pdfBuffer = await generatePDFReport(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=expiry-report-${y}-${m}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/trend — Monthly trend data (last 6 months)
router.get('/trend', protect, managerOrAdmin, async (req, res) => {
  try {
    const storeFilter = {};
    if (req.user.role !== 'admin') {
      storeFilter.store = req.user.store;
    } else if (req.query.store) {
      storeFilter.store = req.query.store;
    }

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const result = await Product.aggregate([
        {
          $match: {
            ...storeFilter,
            expiryDate: { $gte: startDate, $lte: endDate },
            status: 'expired'
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalLoss: { $sum: { $multiply: ['$price', '$quantity'] } }
          }
        }
      ]);

      months.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        year: startDate.getFullYear(),
        expiredCount: result[0]?.count || 0,
        totalLoss: result[0]?.totalLoss || 0
      });
    }

    res.json(months);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
