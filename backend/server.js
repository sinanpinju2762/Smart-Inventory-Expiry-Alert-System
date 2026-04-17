const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://smart-inventory-expiry-alert-system-phi.vercel.app',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    return callback(null, true); // allow all for now
  },
  credentials: true
}));
app.use(express.json());

// Ensure DB is connected before every request (critical for serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/barcode', require('./routes/barcodeRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Smart Inventory API is running' });
});

// Cron Job — only runs in local dev
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
  connectDB().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}

// Vercel: export app as serverless function
module.exports = app;
