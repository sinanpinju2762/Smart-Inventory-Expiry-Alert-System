const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const connectDB = require('./config/db');
const { checkExpiringProducts } = require('./services/expiryChecker');

dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
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

// Cron Job — Check expiring products every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily expiry check...');
  await checkExpiringProducts();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
