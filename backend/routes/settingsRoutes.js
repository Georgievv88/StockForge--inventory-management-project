const router = require("express").Router();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const { requireAuth, requireAdmin } = require("../middleware/auth");
router.use(requireAuth);
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});
router.patch("/profile", async (req, res) => {
  const { name } = req.body || {};
  if (typeof name !== "string" || !name.trim() || name.trim().length > 160)
    return res
      .status(400)
      .json({ message: "Enter a name up to 160 characters" });
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name: name.trim() } },
    { new: true, runValidators: true },
  );
  res.json({ user: publicUser(user) });
});
router.post("/password", async (req, res) => {
  const { currentPassword, password } = req.body || {};
  if (
    typeof currentPassword !== "string" ||
    typeof password !== "string" ||
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 72
  )
    return res
      .status(400)
      .json({
        message: "Use at least 12 characters and at most 72 UTF-8 bytes",
      });
  const user = await User.findById(req.user._id).select("+password");
  if (!(await bcrypt.compare(currentPassword, user.password)))
    return res.status(400).json({ message: "Current password is incorrect" });
  const hashed = await bcrypt.hash(password, 12);
  const result = await User.updateOne(
    { _id: user._id, password: user.password },
    { $set: { password: hashed }, $inc: { tokenVersion: 1 } },
  );
  if (!result.modifiedCount)
    return res
      .status(409)
      .json({ message: "Your account changed. Sign in again and retry." });
  res.clearCookie("stockforge_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  res.json({ message: "Password updated. Sign in again on all devices." });
});
router.get("/users", requireAdmin, async (req, res) =>
  res.json(
    await User.find()
      .select("name email role isActive createdAt")
      .sort({ createdAt: -1 }),
  ),
);
router.patch("/users/:id", requireAdmin, async (req, res) => {
  const { role, isActive } = req.body || {};
  if (
    !mongoose.isValidObjectId(req.params.id) ||
    !["admin", "staff"].includes(role) ||
    typeof isActive !== "boolean"
  )
    return res.status(400).json({ message: "Invalid user settings" });
  if (req.params.id === String(req.user._id))
    return res
      .status(400)
      .json({ message: "You cannot change your own role or active status" });
  // Touch the acting admin within the transaction as well as the target. Concurrent
  // cross-demotions conflict and retry against the new access state.
  const updated = await mongoose.connection.transaction(async (session) => {
    const actor = await User.findOneAndUpdate(
      { _id: req.user._id, role: "admin", isActive: { $ne: false } },
      { $inc: { accessRevision: 1 } },
      { session, new: true },
    );
    if (!actor)
      throw Object.assign(
        new Error("Administrator access changed. Sign in again."),
        { status: 403 },
      );
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role, isActive }, $inc: { tokenVersion: 1 } },
      { session, new: true, runValidators: true },
    );
    if (!user)
      throw Object.assign(new Error("User not found"), { status: 404 });
    return user;
  });
  res.json(publicUser(updated));
});
router.get("/invitations", requireAdmin, async (req, res) =>
  res.json(
    await Invitation.find({ usedAt: null, expiresAt: { $gt: new Date() } })
      .select("email role expiresAt createdAt")
      .sort({ createdAt: -1 }),
  ),
);
router.delete("/invitations/:id", requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid invitation ID" });
  const invitation = await Invitation.findOneAndUpdate(
    { _id: req.params.id, usedAt: null },
    { $set: { expiresAt: new Date(0) } },
  );
  if (!invitation)
    return res.status(404).json({ message: "Invitation is no longer pending" });
  res.json({ message: "Invitation revoked" });
});
module.exports = router;
