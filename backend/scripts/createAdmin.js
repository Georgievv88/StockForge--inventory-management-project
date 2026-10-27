require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const User = require("../models/User");

async function main() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!process.env.MONGO_URL || !name || !email) {
    throw new Error("Missing MONGO_URL, ADMIN_NAME, or ADMIN_EMAIL");
  }

  await mongoose.connect(process.env.MONGO_URL);

  const adminCount = await User.countDocuments({
    role: "admin",
  });

  if (adminCount > 0) {
    console.log("An Admin already exists. Setup cancelled.");
    return;
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("An account with that email already exists");
  }

  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  let password;

  try {
    password = await rl.question("Enter initial Admin password: ");
  } finally {
    rl.close();
  }

  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error(
      "Password must be at least 12 characters and at most 72 UTF-8 bytes",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
    isActive: true,
  });

  console.log("Initial Admin created successfully.");
}

main()
  .catch((error) => {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
