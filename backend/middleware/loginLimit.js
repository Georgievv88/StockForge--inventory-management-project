// Single-process limiter; use a shared store when running multiple API replicas.
const attempts = new Map();
const windowMs = 15 * 60 * 1000;
module.exports = function loginLimit(req, res, next) {
  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.until <= now) attempts.delete(key);
  const key = req.ip;
  const entry = attempts.get(key) || { count: 0, until: now + windowMs };
  entry.count++;
  attempts.set(key, entry);
  if (entry.count > 30) {
    res.set("Retry-After", String(Math.ceil((entry.until - now) / 1000)));
    return res
      .status(429)
      .json({ message: "Too many attempts. Try again in 15 minutes." });
  }
  next();
};
