require("dotenv").config();
const connectDB = require("./config/db");
const app = require("./app");
async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "Set JWT_SECRET to a random secret of at least 32 characters",
    );
  }
  await connectDB();
  await require("./models/Movement").createCollection();
  const port = process.env.PORT || 5000;
  app.listen(port, () =>
    console.log(`Server running at http://localhost:${port}`),
  );
}
startServer().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
