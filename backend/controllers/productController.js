const Product = require("../models/Products");
const inventory = require("../services/inventory");
const mongoose = require("mongoose");
const createProduct = async (req, res) =>
  res.status(201).json(await inventory.create(req.body, req.user));
const updateProduct = async (req, res) =>
  res.json(await inventory.update(req.params.id, req.body, req.user));
const deleteProduct = async (req, res) => {
  await inventory.remove(req.params.id, req.user);
  res.json({ message: "Product successfully deleted" });
};
const getProducts = async (req, res) =>
  res.json(await Product.find().sort({ createdAt: -1 }));
const getProduct = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid product ID" });
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};
module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProduct,
};
