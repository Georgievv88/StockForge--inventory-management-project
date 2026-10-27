const mongoose = require("mongoose");
const Product = require("../models/Products");
const Movement = require("../models/Movement");

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
const fields = [
  "name",
  "sku",
  "category",
  "cost",
  "price",
  "quantity",
  "lowStockThreshold",
];
function validateProduct(body, creating = false) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    fail(400, "Invalid product body");
  const keys = Object.keys(body);
  if (
    !keys.length ||
    keys.some((key) => ![...fields, "expectedVersion"].includes(key))
  )
    fail(400, "Invalid product fields");
  const result = {};
  for (const key of fields) {
    if (body[key] === undefined) continue;
    const value = body[key];
    if (["name", "sku", "category"].includes(key)) {
      if (
        typeof value !== "string" ||
        !value.trim() ||
        value.trim().length > 160
      )
        fail(400, `Invalid ${key}`);
      result[key] = value.trim();
    } else {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1e12
      )
        fail(400, `Invalid ${key}`);
      if (
        ["quantity", "lowStockThreshold"].includes(key) &&
        !Number.isSafeInteger(value)
      )
        fail(400, `${key} must be a whole number`);
      result[key] = value;
    }
  }
  if (
    creating &&
    ["name", "sku", "category", "cost", "price"].some(
      (key) => result[key] === undefined,
    )
  )
    fail(400, "Missing required product fields");
  if (!creating && !Object.keys(result).length)
    fail(400, "No product changes supplied");
  return result;
}
function validId(id) {
  if (!mongoose.isValidObjectId(id)) fail(400, "Invalid product ID");
}
function checkVersion(product, version) {
  if (!Number.isInteger(version) || version !== (product.__v || 0))
    fail(409, "This product changed. Refresh and try again.");
}
async function record(product, before, type, reason, actor, session) {
  await Movement.create(
    [
      {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        type,
        before,
        after: product.quantity,
        delta: product.quantity - before,
        reason,
        actorId: actor._id,
        actorName: actor.name,
      },
    ],
    { session },
  );
}
async function create(body, actor) {
  const values = validateProduct(body, true);
  return mongoose.connection.transaction(async (session) => {
    const [product] = await Product.create([values], { session });
    await record(product, 0, "opening", "Opening stock", actor, session);
    return product;
  });
}
async function update(id, body, actor) {
  validId(id);
  const values = validateProduct(body);
  return mongoose.connection.transaction(async (session) => {
    const product = await Product.findById(id).session(session);
    if (!product) fail(404, "Product not found");
    checkVersion(product, body.expectedVersion);
    const before = product.quantity;
    Object.assign(product, values);
    product.__v = (product.__v || 0) + 1;
    await product.save({ session });
    if (before !== product.quantity)
      await record(
        product,
        before,
        "adjustment",
        "Quantity changed in product editor",
        actor,
        session,
      );
    return product;
  });
}
async function adjust(body, actor) {
  const { productId, type, quantity, reason, expectedVersion } = body || {};
  validId(productId);
  if (!["in", "out", "adjustment"].includes(type))
    fail(400, "Choose a movement type");
  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 0 ||
    quantity > 1e12 ||
    (type !== "adjustment" && quantity === 0)
  )
    fail(400, "Enter a valid whole-number quantity");
  if (
    typeof reason !== "string" ||
    !reason.trim() ||
    reason.trim().length > 500
  )
    fail(400, "Enter a reason (up to 500 characters)");
  return mongoose.connection.transaction(async (session) => {
    const product = await Product.findById(productId).session(session);
    if (!product) fail(404, "Product not found");
    checkVersion(product, expectedVersion);
    const before = product.quantity;
    const after =
      type === "adjustment"
        ? quantity
        : before + (type === "in" ? quantity : -quantity);
    if (after < 0) fail(400, "Not enough stock for this removal");
    if (after > 1e12) fail(400, "Resulting stock exceeds the supported limit");
    if (after === before) fail(400, "Quantity is unchanged");
    product.quantity = after;
    product.__v = (product.__v || 0) + 1;
    await product.save({ session });
    await record(product, before, type, reason.trim(), actor, session);
    return product;
  });
}
async function remove(id, actor) {
  validId(id);
  return mongoose.connection.transaction(async (session) => {
    const product = await Product.findById(id).session(session);
    if (!product) fail(404, "Product not found");
    const before = product.quantity;
    product.quantity = 0;
    await record(product, before, "deleted", "Product deleted", actor, session);
    await Product.deleteOne({ _id: id }, { session });
  });
}
module.exports = {
  create,
  update,
  adjust,
  remove,
  validateProduct,
  checkVersion,
};
