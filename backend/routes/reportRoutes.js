const router = require("express").Router();
const Product = require("../models/Products");
const { requireAuth } = require("../middleware/auth");
router.use(requireAuth);
router.get("/", async (req, res) => {
  // Derive every total from one consistent product snapshot.
  const products = await Product.find().sort({ name: 1 }).lean();
  const categories = new Map();
  let units = 0,
    costValue = 0,
    retailValue = 0;
  for (const p of products) {
    units += p.quantity;
    costValue += p.cost * p.quantity;
    retailValue += p.price * p.quantity;
    const row = categories.get(p.category) || {
      category: p.category,
      products: 0,
      units: 0,
      costValue: 0,
    };
    row.products++;
    row.units += p.quantity;
    row.costValue += p.cost * p.quantity;
    categories.set(p.category, row);
  }
  res.json({
    generatedAt: new Date(),
    totals: {
      products: products.length,
      units,
      costValue,
      retailValue,
      potentialMargin: retailValue - costValue,
    },
    categories: [...categories.values()].sort(
      (a, b) => b.costValue - a.costValue,
    ),
    lowStock: products.filter((p) => p.quantity <= p.lowStockThreshold),
    products,
  });
});
module.exports = router;
