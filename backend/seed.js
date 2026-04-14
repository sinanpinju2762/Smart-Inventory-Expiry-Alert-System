/**
 * ═══════════════════════════════════════════════════════
 *   SEED SCRIPT — Smart Inventory Expiry Alert System
 *   Run: node seed.js
 *   ⚠ Clears all Stores, Products & non-admin Users
 *   Your admin account stays untouched.
 * ═══════════════════════════════════════════════════════
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Store = require('./models/Store');
const Product = require('./models/Product');

// ── helpers ──
const today = new Date();
today.setHours(0, 0, 0, 0);

/** Return a Date offset from today by `days` */
const daysFrom = (days) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const batchNo = () => `BN-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
const barcode = () => `89${Math.floor(Math.random() * 9000000000 + 1000000000)}`;

// ══════════════════════════════════════════════════════
//  DATA DEFINITIONS
// ══════════════════════════════════════════════════════

const STORES = [
  { name: 'FreshMart Central',       address: '12, MG Road, Coimbatore, TN 641001',         phone: '0422-2561234', manager: '' },
  { name: 'FreshMart North',         address: '88, Avinashi Road, Coimbatore, TN 641014',   phone: '0422-2437890', manager: '' },
  { name: 'GreenGrocer Express',     address: '5, Race Course Road, Coimbatore, TN 641018', phone: '0422-2215678', manager: '' },
  { name: 'MegaMart Superstore',     address: '201, Gandhipuram, Coimbatore, TN 641012',    phone: '0422-2303456', manager: '' },
  { name: 'QuickStop Convenience',   address: '34, RS Puram, Coimbatore, TN 641002',        phone: '0422-2447890', manager: '' },
];

// 5 managers (one per store)
const MANAGERS = [
  { name: 'Rahul Menon',       email: 'rahul.m@freshmart.com'      },
  { name: 'Deepa Krishnan',    email: 'deepa.k@freshmart.com'      },
  { name: 'Arjun Nair',        email: 'arjun.n@greengrocer.com'    },
  { name: 'Kavitha Raj',       email: 'kavitha.r@megamart.com'     },
  { name: 'Suresh Kumar',      email: 'suresh.k@quickstop.com'     },
];

// 14 staff across stores (index = store they belong to: 0-4)
const STAFF = [
  // Store 0 — FreshMart Central (4 staff)
  { name: 'Priya Sharma',      email: 'priya.s@freshmart.com',     storeIdx: 0, categories: ['Dairy', 'Beverages'] },
  { name: 'Vikram Das',        email: 'vikram.d@freshmart.com',    storeIdx: 0, categories: ['Bakery', 'Snacks'] },
  { name: 'Anitha Balan',      email: 'anitha.b@freshmart.com',    storeIdx: 0, categories: ['Fruits & Vegetables', 'Meat & Seafood'] },
  { name: 'Karthik Rajan',     email: 'karthik.r@freshmart.com',   storeIdx: 0, categories: ['Frozen', 'Canned'] },

  // Store 1 — FreshMart North (3 staff)
  { name: 'Meena Sundar',      email: 'meena.s@freshmart.com',     storeIdx: 1, categories: ['Dairy', 'Bakery'] },
  { name: 'Ravi Chandran',     email: 'ravi.c@freshmart.com',      storeIdx: 1, categories: ['Beverages', 'Snacks'] },
  { name: 'Lakshmi Devi',      email: 'lakshmi.d@freshmart.com',   storeIdx: 1, categories: ['Personal Care', 'Household'] },

  // Store 2 — GreenGrocer Express (3 staff)
  { name: 'Arun Prakash',      email: 'arun.p@greengrocer.com',    storeIdx: 2, categories: ['Fruits & Vegetables', 'Dairy'] },
  { name: 'Divya Mohan',       email: 'divya.m@greengrocer.com',   storeIdx: 2, categories: ['Grains & Cereals', 'Condiments'] },
  { name: 'Naveen Raj',        email: 'naveen.r@greengrocer.com',  storeIdx: 2, categories: ['Beverages', 'Snacks'] },

  // Store 3 — MegaMart Superstore (2 staff)
  { name: 'Sangeetha Pillai',  email: 'sangeetha.p@megamart.com',  storeIdx: 3, categories: ['Frozen', 'Meat & Seafood', 'Canned'] },
  { name: 'Manoj Kumar',       email: 'manoj.k@megamart.com',      storeIdx: 3, categories: ['Personal Care', 'Household', 'Other'] },

  // Store 4 — QuickStop Convenience (2 staff)
  { name: 'Sowmya Iyer',       email: 'sowmya.i@quickstop.com',    storeIdx: 4, categories: ['Dairy', 'Beverages', 'Snacks'] },
  { name: 'Ganesh Babu',       email: 'ganesh.b@quickstop.com',    storeIdx: 4, categories: ['Bakery', 'Canned', 'Condiments'] },
];

// ── Products per store (storeIdx → array) ──
// status is auto-calculated from expiryDate
// daysOffset: negative = expired, 0-7 = expiring_soon, >7 = safe

const PRODUCTS = [

  // ═══════════ Store 0: FreshMart Central (18 products) ═══════════
  { storeIdx: 0, name: 'Amul Taaza Milk',         category: 'Dairy',                brand: 'Amul',        qty: 120, price: 25,   days: -3  },
  { storeIdx: 0, name: 'Amul Butter 100g',        category: 'Dairy',                brand: 'Amul',        qty: 45,  price: 56,   days: 14  },
  { storeIdx: 0, name: 'Nandini Curd 400g',       category: 'Dairy',                brand: 'Nandini',     qty: 60,  price: 30,   days: 2   },
  { storeIdx: 0, name: 'Britannia White Bread',   category: 'Bakery',               brand: 'Britannia',   qty: 30,  price: 40,   days: -1  },
  { storeIdx: 0, name: 'Britannia Good Day',      category: 'Bakery',               brand: 'Britannia',   qty: 80,  price: 30,   days: 45  },
  { storeIdx: 0, name: 'Pepsi 750ml',             category: 'Beverages',            brand: 'PepsiCo',     qty: 200, price: 38,   days: 90  },
  { storeIdx: 0, name: 'Tropicana Orange 1L',     category: 'Beverages',            brand: 'Tropicana',   qty: 35,  price: 99,   days: 5   },
  { storeIdx: 0, name: 'Lays Classic Salted',     category: 'Snacks',               brand: 'Lays',        qty: 150, price: 20,   days: 60  },
  { storeIdx: 0, name: 'Haldiram Aloo Bhujia',    category: 'Snacks',               brand: "Haldiram's",  qty: 40,  price: 85,   days: -7  },
  { storeIdx: 0, name: 'McCain French Fries 450g',category: 'Frozen',               brand: 'McCain',      qty: 25,  price: 155,  days: 120 },
  { storeIdx: 0, name: 'Frozen Peas 500g',        category: 'Frozen',               brand: 'Safal',       qty: 40,  price: 75,   days: 3   },
  { storeIdx: 0, name: 'Del Monte Corn 400g',     category: 'Canned',               brand: 'Del Monte',   qty: 50,  price: 95,   days: 180 },
  { storeIdx: 0, name: 'Fresh Bananas 1kg',       category: 'Fruits & Vegetables',  brand: '',            qty: 30,  price: 45,   days: 1   },
  { storeIdx: 0, name: 'Red Onions 1kg',          category: 'Fruits & Vegetables',  brand: '',            qty: 80,  price: 35,   days: 6   },
  { storeIdx: 0, name: 'Chicken Breast 500g',     category: 'Meat & Seafood',       brand: 'FreshToday',  qty: 15,  price: 220,  days: -2  },
  { storeIdx: 0, name: 'Tata Sampann Dal 1kg',    category: 'Grains & Cereals',     brand: 'Tata',        qty: 100, price: 130,  days: 200 },
  { storeIdx: 0, name: 'Kissan Tomato Ketchup',   category: 'Condiments',           brand: 'Kissan',      qty: 55,  price: 105,  days: 30  },
  { storeIdx: 0, name: 'Dettol Soap 75g',         category: 'Personal Care',        brand: 'Dettol',      qty: 90,  price: 38,   days: 365 },

  // ═══════════ Store 1: FreshMart North (16 products) ═══════════
  { storeIdx: 1, name: 'Mother Dairy Milk 500ml',  category: 'Dairy',               brand: 'Mother Dairy', qty: 90,  price: 28,  days: -5  },
  { storeIdx: 1, name: 'Amul Cheese Slices',       category: 'Dairy',               brand: 'Amul',         qty: 35,  price: 120, days: 20  },
  { storeIdx: 1, name: 'Paneer Fresh 200g',        category: 'Dairy',               brand: 'Amul',         qty: 25,  price: 80,  days: 0   },
  { storeIdx: 1, name: 'Harvest Gold Bread',       category: 'Bakery',              brand: 'Harvest Gold', qty: 40,  price: 45,  days: -2  },
  { storeIdx: 1, name: 'Parle Rusk 300g',          category: 'Bakery',              brand: 'Parle',        qty: 100, price: 38,  days: 60  },
  { storeIdx: 1, name: 'Coca-Cola 2L',             category: 'Beverages',           brand: 'Coca-Cola',    qty: 60,  price: 85,  days: 75  },
  { storeIdx: 1, name: 'Real Mango Juice 1L',      category: 'Beverages',           brand: 'Real',         qty: 28,  price: 110, days: 4   },
  { storeIdx: 1, name: 'Kurkure Masala Munch',     category: 'Snacks',              brand: 'Kurkure',      qty: 120, price: 20,  days: 45  },
  { storeIdx: 1, name: 'Bingo Mad Angles',         category: 'Snacks',              brand: 'ITC',          qty: 75,  price: 20,  days: -10 },
  { storeIdx: 1, name: 'Dove Shampoo 180ml',       category: 'Personal Care',       brand: 'Dove',         qty: 40,  price: 175, days: 300 },
  { storeIdx: 1, name: 'Surf Excel 1kg',           category: 'Household',           brand: 'HUL',          qty: 55,  price: 220, days: 400 },
  { storeIdx: 1, name: 'Harpic Toilet Cleaner',    category: 'Household',           brand: 'Harpic',       qty: 30,  price: 78,  days: 250 },
  { storeIdx: 1, name: 'Maggi Noodles Pack of 12', category: 'Snacks',              brand: 'Nestle',       qty: 65,  price: 168, days: 90  },
  { storeIdx: 1, name: 'Aashirvaad Atta 5kg',      category: 'Grains & Cereals',    brand: 'ITC',          qty: 40,  price: 290, days: 150 },
  { storeIdx: 1, name: 'Saffola Gold Oil 1L',      category: 'Condiments',          brand: 'Saffola',      qty: 30,  price: 195, days: 180 },
  { storeIdx: 1, name: 'MTR Sambar Powder 200g',   category: 'Condiments',          brand: 'MTR',          qty: 50,  price: 65,  days: 7   },

  // ═══════════ Store 2: GreenGrocer Express (14 products) ═══════════
  { storeIdx: 2, name: 'Fresh Tomatoes 1kg',       category: 'Fruits & Vegetables', brand: '',              qty: 50,  price: 30,  days: 3   },
  { storeIdx: 2, name: 'Green Capsicum 500g',      category: 'Fruits & Vegetables', brand: '',              qty: 35,  price: 40,  days: 5   },
  { storeIdx: 2, name: 'Apple Shimla 1kg',         category: 'Fruits & Vegetables', brand: '',              qty: 20,  price: 180, days: 6   },
  { storeIdx: 2, name: 'Spinach Bunch',            category: 'Fruits & Vegetables', brand: '',              qty: 40,  price: 25,  days: -1  },
  { storeIdx: 2, name: 'Heritage Milk 500ml',      category: 'Dairy',               brand: 'Heritage',     qty: 80,  price: 27,  days: -4  },
  { storeIdx: 2, name: 'Go Cheese Spread',         category: 'Dairy',               brand: 'Go',           qty: 20,  price: 95,  days: 12  },
  { storeIdx: 2, name: 'India Gate Basmati 1kg',   category: 'Grains & Cereals',    brand: 'India Gate',   qty: 60,  price: 145, days: 240 },
  { storeIdx: 2, name: 'Tata Salt 1kg',            category: 'Condiments',          brand: 'Tata',         qty: 100, price: 24,  days: 365 },
  { storeIdx: 2, name: 'MDH Chana Masala',         category: 'Condiments',          brand: 'MDH',          qty: 45,  price: 72,  days: 2   },
  { storeIdx: 2, name: 'Sprite 600ml',             category: 'Beverages',           brand: 'Coca-Cola',    qty: 90,  price: 35,  days: 60  },
  { storeIdx: 2, name: 'Paper Boat Aam Panna',     category: 'Beverages',           brand: 'Paper Boat',   qty: 30,  price: 30,  days: -8  },
  { storeIdx: 2, name: 'Parle-G Biscuits',         category: 'Snacks',              brand: 'Parle',        qty: 200, price: 10,  days: 90  },
  { storeIdx: 2, name: 'Balaji Wafers',            category: 'Snacks',              brand: 'Balaji',       qty: 50,  price: 20,  days: 30  },
  { storeIdx: 2, name: 'Vim Liquid 500ml',         category: 'Household',           brand: 'HUL',          qty: 35,  price: 99,  days: 300 },

  // ═══════════ Store 3: MegaMart Superstore (16 products) ═══════════
  { storeIdx: 3, name: 'Amul Gold Milk 1L',        category: 'Dairy',               brand: 'Amul',         qty: 150, price: 68,  days: -1  },
  { storeIdx: 3, name: 'Milky Mist Yoghurt 200g',  category: 'Dairy',               brand: 'Milky Mist',   qty: 40,  price: 35,  days: 1   },
  { storeIdx: 3, name: 'Britannia Cake Rusk',      category: 'Bakery',              brand: 'Britannia',    qty: 55,  price: 42,  days: 30  },
  { storeIdx: 3, name: 'Frozen Prawns 500g',       category: 'Frozen',              brand: 'Gadre',        qty: 12,  price: 350, days: 45  },
  { storeIdx: 3, name: 'Frozen Mixed Veg 1kg',     category: 'Frozen',              brand: 'Safal',        qty: 30,  price: 125, days: -15 },
  { storeIdx: 3, name: 'Rajma Canned 400g',        category: 'Canned',              brand: 'Del Monte',    qty: 40,  price: 85,  days: 200 },
  { storeIdx: 3, name: 'Canned Pineapple Slices',  category: 'Canned',              brand: 'Del Monte',    qty: 25,  price: 120, days: 6   },
  { storeIdx: 3, name: 'Mutton Leg 1kg',           category: 'Meat & Seafood',      brand: 'Licious',      qty: 8,   price: 750, days: -3  },
  { storeIdx: 3, name: 'Salmon Fillet 250g',       category: 'Meat & Seafood',      brand: 'FreshToDay',   qty: 10,  price: 550, days: 2   },
  { storeIdx: 3, name: 'Colgate MaxFresh 150g',    category: 'Personal Care',       brand: 'Colgate',      qty: 70,  price: 95,  days: 400 },
  { storeIdx: 3, name: 'Nivea Body Lotion 200ml',  category: 'Personal Care',       brand: 'Nivea',        qty: 25,  price: 225, days: 180 },
  { storeIdx: 3, name: 'Lizol Floor Cleaner 1L',   category: 'Household',           brand: 'Lizol',        qty: 40,  price: 165, days: 300 },
  { storeIdx: 3, name: 'Fortune Sunflower Oil 1L', category: 'Condiments',          brand: 'Fortune',      qty: 35,  price: 145, days: 120 },
  { storeIdx: 3, name: 'Red Bull 250ml',           category: 'Beverages',           brand: 'Red Bull',     qty: 100, price: 115, days: 90  },
  { storeIdx: 3, name: 'Cornitos Nachos',          category: 'Snacks',              brand: 'Cornitos',     qty: 45,  price: 99,  days: -5  },
  { storeIdx: 3, name: 'Duracell AA Batteries 4pk',category: 'Other',               brand: 'Duracell',     qty: 60,  price: 140, days: 700 },

  // ═══════════ Store 4: QuickStop Convenience (11 products) ═══════════
  { storeIdx: 4, name: 'Amul Kool Lassi 200ml',    category: 'Dairy',               brand: 'Amul',         qty: 50,  price: 25,  days: -6  },
  { storeIdx: 4, name: 'Amul Masti Chaas 200ml',   category: 'Dairy',               brand: 'Amul',         qty: 60,  price: 15,  days: 0   },
  { storeIdx: 4, name: 'Britannia Jim Jam',        category: 'Bakery',              brand: 'Britannia',    qty: 40,  price: 30,  days: 55  },
  { storeIdx: 4, name: 'Thumbs Up 300ml',          category: 'Beverages',           brand: 'Coca-Cola',    qty: 120, price: 20,  days: 60  },
  { storeIdx: 4, name: 'Bisleri Water 1L',         category: 'Beverages',           brand: 'Bisleri',      qty: 200, price: 20,  days: 180 },
  { storeIdx: 4, name: 'Pringles Sour Cream',      category: 'Snacks',              brand: 'Pringles',     qty: 30,  price: 149, days: 40  },
  { storeIdx: 4, name: 'Cadbury Dairy Milk Silk',   category: 'Snacks',              brand: 'Cadbury',      qty: 50,  price: 85,  days: 4   },
  { storeIdx: 4, name: 'Rajnigandha Pan Masala',   category: 'Other',               brand: 'DS Group',     qty: 100, price: 40,  days: 120 },
  { storeIdx: 4, name: 'Maggi Hot & Sweet Sauce',  category: 'Condiments',          brand: 'Nestle',       qty: 35,  price: 110, days: 3   },
  { storeIdx: 4, name: 'Toor Dal Tata 500g',       category: 'Canned',              brand: 'Tata',         qty: 45,  price: 75,  days: 150 },
  { storeIdx: 4, name: 'Lifebuoy Handwash 190ml',  category: 'Personal Care',       brand: 'Lifebuoy',     qty: 30,  price: 55,  days: -12 },
];


// ══════════════════════════════════════════════════════
//  SEED FUNCTION
// ══════════════════════════════════════════════════════

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n🔌  Connected to MongoDB');

    // ── 1. Find existing admin ──
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌  No admin account found. Please register first, then run this script.');
      process.exit(1);
    }
    console.log(`✅  Admin found: ${admin.name} (${admin.email})`);

    // ── 2. Clear old data (keep admin) ──
    await Product.deleteMany({});
    await Store.deleteMany({});
    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('🗑️   Cleared old stores, products & non-admin users');

    // ── 3. Create stores ──
    const storesDocs = await Store.insertMany(STORES);
    console.log(`🏪  Created ${storesDocs.length} stores`);

    // ── 4. Create managers ──
    const managerDocs = [];
    for (let i = 0; i < MANAGERS.length; i++) {
      const m = new User({
        name: MANAGERS[i].name,
        email: MANAGERS[i].email,
        password: 'Pass@123',
        role: 'manager',
        store: storesDocs[i]._id,
      });
      await m.save(); // triggers pre-save password hash
      managerDocs.push(m);

      // update store's manager field
      storesDocs[i].manager = MANAGERS[i].name;
      await storesDocs[i].save();
    }
    console.log(`👔  Created ${managerDocs.length} managers`);

    // ── 5. Create staff ──
    const staffDocs = [];
    for (const s of STAFF) {
      const u = new User({
        name: s.name,
        email: s.email,
        password: 'Pass@123',
        role: 'staff',
        store: storesDocs[s.storeIdx]._id,
        assignedCategories: s.categories,
      });
      await u.save();
      staffDocs.push(u);
    }
    console.log(`🧑‍💼  Created ${staffDocs.length} staff members`);

    // ── 6. Create products ──
    const allUsers = [...managerDocs, ...staffDocs];
    const productDocs = [];

    for (const p of PRODUCTS) {
      const storeId = storesDocs[p.storeIdx]._id;
      const expiryDate = daysFrom(p.days);
      const mfgDate = new Date(expiryDate);
      mfgDate.setMonth(mfgDate.getMonth() - 3); // mfg ~3 months before expiry

      // auto-compute status
      let status = 'safe';
      if (p.days < 0) status = 'expired';
      else if (p.days <= 7) status = 'expiring_soon';

      // pick a random user from that store as addedBy
      const storeUsers = allUsers.filter(u => u.store.toString() === storeId.toString());
      const addedBy = storeUsers.length > 0 ? pick(storeUsers)._id : admin._id;

      productDocs.push({
        name: p.name,
        category: p.category,
        brand: p.brand,
        quantity: p.qty,
        price: p.price,
        expiryDate,
        manufacturingDate: mfgDate,
        store: storeId,
        addedBy,
        status,
        barcode: barcode(),
        batchNumber: batchNo(),
      });
    }

    await Product.insertMany(productDocs);
    console.log(`📦  Created ${productDocs.length} products`);

    // ── Summary ──
    const expired = productDocs.filter(p => p.status === 'expired').length;
    const expiring = productDocs.filter(p => p.status === 'expiring_soon').length;
    const safe = productDocs.filter(p => p.status === 'safe').length;

    console.log('\n══════════════════════════════════════════');
    console.log('  🎉  SEED COMPLETE!');
    console.log('══════════════════════════════════════════');
    console.log(`  🏪  Stores    : ${storesDocs.length}`);
    console.log(`  👔  Managers  : ${managerDocs.length}`);
    console.log(`  🧑‍💼  Staff     : ${staffDocs.length}`);
    console.log(`  📦  Products  : ${productDocs.length}`);
    console.log(`       ✅ Safe       : ${safe}`);
    console.log(`       ⚠️  Expiring   : ${expiring}`);
    console.log(`       ❌ Expired    : ${expired}`);
    console.log('══════════════════════════════════════════');
    console.log('\n  🔑  All mock user passwords: Pass@123');
    console.log('  📧  Manager login example: rahul.m@freshmart.com');
    console.log('  📧  Staff login example:   priya.s@freshmart.com\n');

    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
