const router = require("express").Router();
const Movement = require("../models/Movement");
const inventory = require("../services/inventory");
const { requireAuth } = require("../middleware/auth");
router.use(requireAuth);
router.get("/", async (req, res) => {
  const page = Math.max(
    1,
    Math.min(100000, Number.parseInt(req.query.page, 10) || 1),
  );
  const filter = {};
  if (req.query.type) {
    if (
      !["opening", "in", "out", "adjustment", "deleted"].includes(
        req.query.type,
      )
    )
      return res.status(400).json({ message: "Invalid movement type" });
    filter.type = req.query.type;
  }
  if (req.query.search) {
    const escaped = String(req.query.search)
      .slice(0, 160)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { productName: { $regex: escaped, $options: "i" } },
      { sku: { $regex: escaped, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    Movement.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * 25)
      .limit(25),
    Movement.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / 25)) });
});
router.post("/", async (req, res) =>
  res.status(201).json(await inventory.adjust(req.body, req.user)),
);
module.exports = router;
