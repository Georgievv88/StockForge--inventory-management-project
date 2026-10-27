const express = require("express");
const {
  getProducts,
  getProduct,
  createProduct,
  deleteProduct,
  updateProduct,
} = require("../controllers/productController.js");

const { requireAuth, requireAdmin } = require("../middleware/auth");
const router = express.Router();
router.use(requireAuth);

router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", createProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

module.exports = router;
