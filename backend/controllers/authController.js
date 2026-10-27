const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Invitation = require("../models/Invitation");

async function acceptInvitation(req, res) {
  const { token, name, password } = req.body || {};

  if (
    typeof token !== "string" ||
    typeof name !== "string" ||
    typeof password !== "string" ||
    !token ||
    !name.trim() ||
    name.trim().length > 160 ||
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      message: "Invalid invitation or account details",
    });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const invitation = await Invitation.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    }).select("+tokenHash");

    if (!invitation) {
      return res.status(400).json({
        message: "Invalid or expired invitation",
      });
    }

    const existingUser = await User.findOne({
      email: invitation.email,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account already exists for this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const claimedInvitation = await Invitation.findOneAndUpdate(
          {
            _id: invitation._id,
            usedAt: null,
            expiresAt: { $gt: new Date() },
          },
          { $set: { usedAt: new Date() } },
          { new: true, session },
        );

        if (!claimedInvitation) {
          const error = new Error("Invitation already used or expired");
          error.status = 400;
          throw error;
        }

        await User.create(
          [
            {
              name: name.trim(),
              email: invitation.email,
              password: hashedPassword,
              role: invitation.role,
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    return res.status(201).json({
      message: "Account created successfully",
    });
  } catch (err) {
    if (err.status === 400)
      return res.status(400).json({ message: err.message });
    if (err.code === 11000) {
      return res.status(409).json({
        message: "An account already exists",
      });
    }

    console.error(err);

    return res.status(500).json({
      message: "Failed to accept invitation",
    });
  }
}

async function login(req, res) {
  const { email, password } = req.body || {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    const token = jwt.sign(
      { userId: user._id.toString(), tokenVersion: user.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: "8h", algorithm: "HS256" },
    );
    res.cookie("stockforge_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      message: "Login failed",
    });
  }
}

function logout(req, res) {
  res.clearCookie("stockforge_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    message: "Logout successful",
  });
}

async function createInvitation(req, res) {
  const { email, role = "staff" } = req.body || {};
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    !["admin", "staff"].includes(role)
  ) {
    return res.status(400).json({ message: "Enter a valid email and role" });
  }
  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail }))
      return res
        .status(409)
        .json({ message: "An account already exists for this email" });
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await Invitation.create({
      email: normalizedEmail,
      role,
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      expiresAt,
      invitedBy: req.user._id,
    });
    const invitationUrl = new URL(
      "/register",
      process.env.FRONTEND_URL ||
        process.env.RENDER_EXTERNAL_URL ||
        "http://localhost:5173",
    );
    invitationUrl.searchParams.set("token", token);
    return res.status(201).json({
      invitationUrl: invitationUrl.toString(),
      expiresAt,
      email: normalizedEmail,
    });
  } catch {
    return res.status(500).json({ message: "Failed to create invitation" });
  }
}

function me(req, res) {
  const { _id, name, email, role } = req.user;
  return res.json({ user: { id: _id, name, email, role } });
}

module.exports = {
  createInvitation,
  me,
  acceptInvitation,
  login,
  logout,
};
