const mongoose = require("mongoose");
const Product = require("../models/Products");

const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "A product with this SKU already exists" });
    }

    res.status(400).json({
      message: error.message,
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json(products);
  } catch (error) {
    res.status("Error fetching products:", error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};

const getProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const allowedFields = [
      "name",
      "sku",
      "category",
      "cost",
      "price",
      "quantity",
      "lowStockThreshold",
    ];

    const fields = Object.keys(req.body);

    if (
      fields.length === 0 ||
      fields.some((field) => !allowedFields.includes(field))
    ) {
      return res.status(400).json({
        message: "Invalid or empty update fields",
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A product with this SKU already exists",
      });
    }
  }
};

const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    res.status(200).json({
      message: "Product successfully deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete product",
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  createProduct,
};
