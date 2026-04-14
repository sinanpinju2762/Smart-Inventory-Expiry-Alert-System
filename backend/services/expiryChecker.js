const Product = require('../models/Product');

const checkExpiringProducts = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    // Mark expired products
    await Product.updateMany(
      { expiryDate: { $lt: today }, status: { $ne: 'expired' }, quantity: { $gt: 0 } },
      { status: 'expired' }
    );

    // Mark expiring soon products
    await Product.updateMany(
      { expiryDate: { $gte: today, $lte: in7Days }, status: { $ne: 'expiring_soon' }, quantity: { $gt: 0 } },
      { status: 'expiring_soon' }
    );

    // Mark safe products (expiry > 7 days)
    await Product.updateMany(
      { expiryDate: { $gt: in7Days }, status: { $ne: 'safe' }, quantity: { $gt: 0 } },
      { status: 'safe' }
    );

    console.log('Expiry status updated for all products.');
  } catch (error) {
    console.error('Expiry check failed:', error.message);
  }
};

module.exports = { checkExpiringProducts };
