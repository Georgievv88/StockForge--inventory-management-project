const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  const token = req.cookies?.stockify_token;
  if (!token) return res.status(401).json({ message: "Please sign in" });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.userId !== "string" ||
      !/^[a-f\d]{24}$/i.test(payload.userId)
    ) {
      return res.status(401).json({ message: "Invalid session" });
    }
  } catch {
    return res
      .status(401)
      .json({ message: "Session expired. Please sign in again" });
  }
  try {
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive)
      return res.status(401).json({ message: "Account unavailable" });
    if ((payload.tokenVersion || 0) !== (user.tokenVersion || 0))
      return res
        .status(401)
        .json({ message: "Session changed. Sign in again." });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Administrator access required" });
  next();
}

module.exports = { requireAuth, requireAdmin };
