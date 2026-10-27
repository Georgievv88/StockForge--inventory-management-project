const express = require("express");

const {
  acceptInvitation,
  login,
  logout,
  me,
  createInvitation,
} = require("../controllers/authController");

const router = express.Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.get("/me", requireAuth, me);
router.post("/invitations", requireAuth, requireAdmin, createInvitation);

router.post("/accept-invitation", acceptInvitation);
router.post("/login", require("../middleware/loginLimit"), login);
router.post("/logout", logout);

module.exports = router;
