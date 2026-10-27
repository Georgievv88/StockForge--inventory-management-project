const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    type: {
      type: String,
      enum: ["opening", "in", "out", "adjustment", "deleted"],
      required: true,
    },
    delta: { type: Number, required: true },
    before: { type: Number, required: true },
    after: { type: Number, required: true },
    reason: { type: String, required: true, maxlength: 500 },
    actorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    actorName: { type: String, required: true },
  },
  { timestamps: true },
);
schema.index({ createdAt: -1, _id: -1 });
module.exports = mongoose.model("Movement", schema);
