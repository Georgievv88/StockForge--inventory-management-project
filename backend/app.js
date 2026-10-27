const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const origin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin, credentials: true }));
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.origin &&
    req.headers.origin !== origin
  ) {
    return res.status(403).json({ message: "Origin not allowed" });
  }
  next();
});
app.get("/api/health", (req, res) =>
  res.json({ message: "StockForge API is running!", status: "success" }),
);
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/movements", require("./routes/movementRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
// Express error handlers require all four arguments.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === 11000)
    return res
      .status(409)
      .json({
        message:
          "A record with these details already exists (check the SKU or email)",
      });
  if (["ValidationError", "CastError"].includes(error.name))
    return res
      .status(400)
      .json({ message: "Invalid values. Check your input." });
  const status = [400, 401, 403, 404, 409, 413, 429].includes(error.status)
    ? error.status
    : 500;
  res
    .status(status)
    .json({
      message:
        status === 500
          ? "Unable to complete the request. Please try again."
          : error.type === "entity.parse.failed"
            ? "Invalid JSON body"
            : error.message,
    });
});
module.exports = app;
