const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/barcode', require('./routes/barcodeRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Smart Inventory Expiry Alert System API is running' });
});

// Cron Job — only runs in local dev (node-cron doesn't work in serverless)
if (process.env.NODE_ENV !== 'production') {
  const cron = require('node-cron');
  const { checkExpiringProducts } = require('./services/expiryChecker');
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily expiry check...');
    await checkExpiringProducts();
  });
}

// Local dev: start server
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Vercel: export app as serverless function
module.exports = app;
