import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ── Fix __dirname for ES Modules ──────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── Load .env from root ───────────────────────────────────────
dotenv.config({ path: resolve(__dirname, '../../.env') });

// ── Inline connectDB (avoid import issues) ────────────────────
const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
};

// ── Schemas (inline to avoid circular imports) ────────────────
const inventorySchema = new mongoose.Schema(
  {
    product:           { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productName:       { type: String, required: true },
    supplier:          { type: String, default: '' },
    category:          { type: String, default: '' },
    sku:               { type: String, default: '' },
    stockQty:          { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    retailPrice:       { type: Number, default: 0 },
    wholesalePrice:    { type: Number, default: 0 },
    costPrice:         { type: Number, default: 0 },
    notes:             { type: String, default: '' },
    isActive:          { type: Boolean, default: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name:              { type: String },
    price:             { type: Number },
    category:          { type: String },
    countInStock:      { type: Number },
    supplier:          { type: String },
    wholesalePrice:    { type: Number },
    lowStockThreshold: { type: Number },
    sku:               { type: String },
    isArchived:        { type: Boolean },
  },
  { strict: false }
);

// ── Main sync function ────────────────────────────────────────
const sync = async () => {
  try {
    await connectDB();

    // Use existing models if registered, else create
    const Product   = mongoose.models.Product   || mongoose.model('Product', productSchema);
    const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);

    const products = await Product.find({ isArchived: { $ne: true } });
    console.log(`\n📦 Found ${products.length} products to sync\n`);

    if (products.length === 0) {
      console.log('⚠️  No products found. Check your MONGO_URI in .env');
      process.exit(0);
    }

    let created = 0;
    let skipped = 0;

    for (const p of products) {
      const exists = await Inventory.findOne({ product: p._id });

      if (exists) {
        console.log(`⏭️  Already in inventory: ${p.name}`);
        skipped++;
        continue;
      }

      await Inventory.create({
        product:           p._id,
        productName:       p.name,
        supplier:          p.supplier || '',
        category:          p.category || '',
        sku:               p.sku || p._id.toString().slice(-8).toUpperCase(),
        stockQty:          p.countInStock || 0,
        lowStockThreshold: p.lowStockThreshold || 5,
        retailPrice:       p.price || 0,
        wholesalePrice:    p.wholesalePrice || 0,
        costPrice:         0,
        notes:             '',
        isActive:          true,
      });

      console.log(`✅ Synced: ${p.name} (stock: ${p.countInStock}, price: ₱${p.price})`);
      created++;
    }

    console.log(`\n🎉 Sync complete!`);
    console.log(`   Created : ${created}`);
    console.log(`   Skipped : ${skipped}`);
    console.log(`   Total   : ${products.length}\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
    process.exit(1);
  }
};

sync();