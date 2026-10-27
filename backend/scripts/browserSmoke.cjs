// Isolated browser regression check. No MongoDB connection or real records.
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const express = require("express");
process.env.JWT_SECRET = "isolated-browser-test-secret-32-characters";
process.env.FRONTEND_URL = "http://localhost:5178";
const Product = require("../models/Products");
const Movement = require("../models/Movement");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const app = require("../app");
const products = [],
  movements = [],
  invitations = [],
  users = [];
const objectId = () => new mongoose.Types.ObjectId().toString();
function query(get) {
  let offset = 0,
    limit = Infinity;
  return {
    select() {
      return this;
    },
    sort() {
      return this;
    },
    session() {
      return this;
    },
    lean() {
      return this;
    },
    skip(n) {
      offset = n;
      return this;
    },
    limit(n) {
      limit = n;
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve()
        .then(() => {
          const value = get();
          return Array.isArray(value)
            ? value.slice(offset, offset + limit)
            : value;
        })
        .then(resolve, reject);
    },
  };
}
function makeProduct(body) {
  const p = {
    ...body,
    _id: objectId(),
    __v: 0,
    createdAt: new Date(),
    lowStockThreshold: body.lowStockThreshold ?? 5,
  };
  p.save = async () => p;
  return p;
}
Product.find = () => query(() => products);
Product.findById = (id) =>
  query(() => products.find((p) => p._id === String(id)));
Product.create = async ([body]) => {
  const p = makeProduct(body);
  products.push(p);
  return [p];
};
Product.deleteOne = async ({ _id }) => {
  products.splice(
    products.findIndex((p) => p._id === _id),
    1,
  );
};
Movement.create = async (rows) => {
  movements.unshift(
    ...rows.map((r) => ({ ...r, _id: objectId(), createdAt: new Date() })),
  );
};
Movement.find = () => query(() => movements);
Movement.countDocuments = async () => movements.length;
User.findById = (id) => query(() => users.find((u) => u._id === String(id)));
User.findOne = ({ email }) => query(() => users.find((u) => u.email === email));
User.find = () =>
  query(() =>
    users.map(({ password, ...u }) => ({ ...u, password: undefined })),
  );
User.exists = async ({ email }) => users.some((u) => u.email === email);
User.findByIdAndUpdate = async (id, update) => {
  const u = users.find((u) => u._id === String(id));
  if (!u) return null;
  Object.assign(u, update.$set);
  for (const [key, delta] of Object.entries(update.$inc || {}))
    u[key] = (u[key] || 0) + delta;
  return u;
};
User.findOneAndUpdate = async ({ _id }) =>
  users.find((u) => u._id === String(_id) && u.role === "admin" && u.isActive);
Invitation.create = async (body) => {
  invitations.push({ ...body, _id: objectId(), createdAt: new Date() });
};
Invitation.find = () =>
  query(() => invitations.filter((i) => i.expiresAt > new Date()));
Invitation.findOneAndUpdate = async ({ _id }, update) => {
  const i = invitations.find((i) => i._id === _id);
  if (i) Object.assign(i, update.$set);
  return i;
};
mongoose.connection.transaction = async (fn) => fn({});

async function main() {
  const password = "test-password-123";
  const hash = await bcrypt.hash(password, 4);
  users.push(
    {
      _id: objectId(),
      name: "Test Admin",
      email: "admin@example.com",
      password: hash,
      role: "admin",
      isActive: true,
      tokenVersion: 0,
    },
    {
      _id: objectId(),
      name: "Test Staff",
      email: "staff@example.com",
      password: hash,
      role: "staff",
      isActive: true,
      tokenVersion: 0,
    },
  );
  products.push(
    makeProduct({
      name: "Test GPU",
      sku: "TEST-GPU",
      category: "Graphics Cards",
      cost: 100,
      price: 150,
      quantity: 8,
      lowStockThreshold: 5,
    }),
  );
  const api = app.listen(0, "127.0.0.1");
  await new Promise((r) => api.once("listening", r));
  const web = express();
  const dist = path.resolve(__dirname, "../../frontend/dist");
  web.use(express.static(dist));
  web.use((req, res) => res.sendFile(path.join(dist, "index.html")));
  const frontend = web.listen(5178);
  await new Promise((r) => frontend.once("listening", r));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      acceptDownloads: true,
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route(/^http:\/\/localhost:(5000|5178)\/api\//, async (route) => {
      const url = new URL(route.request().url());
      const response = await route.fetch({
        url: `http://127.0.0.1:${api.address().port}${url.pathname}${url.search}`,
      });
      await route.fulfill({ response });
    });
    await page.goto("http://localhost:5178/products");
    await page.waitForURL("**/login");
    await page.getByLabel("Email Address").fill("staff@example.com");
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.waitForURL("**/products");
    await page
      .getByRole("button", { name: "Add Product", exact: true })
      .click();
    await page.getByLabel("Product Name").fill("Staff SSD");
    await page.getByLabel("SKU", { exact: true }).fill("STAFF-SSD");
    await page.getByLabel("Unit Cost", { exact: true }).fill("50");
    await page.getByLabel("Selling Price", { exact: true }).fill("80");
    await page.getByLabel("Quantity", { exact: true }).fill("4");
    await page
      .getByRole("button", { name: "Save Product", exact: true })
      .click();
    await page.getByRole("cell", { name: "Staff SSD", exact: true }).waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Delete", exact: true }).count(),
      0,
    );
    await page
      .getByRole("row")
      .filter({ hasText: "Staff SSD" })
      .getByRole("button", { name: "Edit", exact: true })
      .click();
    await page.getByLabel("Quantity", { exact: true }).fill("6");
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Edit Product", exact: true })
      .waitFor({ state: "hidden" });
    await page
      .getByRole("link", { name: "Stock Movements", exact: true })
      .click();
    await page
      .getByLabel("Product", { exact: true })
      .selectOption({ label: "Staff SSD · STAFF-SSD" });
    await page.getByLabel("Units", { exact: true }).fill("3");
    await page.getByLabel("Reason", { exact: true }).fill("Smoke test receipt");
    await page.getByRole("button", { name: "Record movement" }).click();
    await page.getByText("Stock updated and movement recorded.").waitFor();
    assert.equal(products.find((p) => p.name === "Staff SSD").quantity, 9);
    await page.getByRole("link", { name: "Reports", exact: true }).click();
    await page
      .getByRole("heading", { name: "Inventory by category" })
      .waitFor();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export inventory CSV" }).click();
    assert.equal(
      (await download).suggestedFilename(),
      "stockforge-inventory.csv",
    );
    const output = path.resolve(__dirname, "../../artifacts");
    fs.mkdirSync(output, { recursive: true });
    await page.screenshot({
      path: path.join(output, "reports-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(output, "reports-mobile.png"),
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      "mobile layout must not overflow horizontally",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await page.getByLabel("Full name", { exact: true }).fill("Updated Staff");
    await page.getByRole("button", { name: "Save profile" }).click();
    await page.getByText("Profile updated.").waitFor();
    const nightMode = page.getByRole("switch", { name: "Night mode" });
    assert.equal(await nightMode.getAttribute("aria-checked"), "true");
    await nightMode.click();
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "light",
    );
    await page.reload();
    await page.getByRole("switch", { name: "Night mode" }).waitFor();
    assert.equal(
      await page
        .getByRole("switch", { name: "Night mode" })
        .getAttribute("aria-checked"),
      "false",
    );
    assert.equal(
      await page.evaluate(() => localStorage.getItem("stockforge-theme")),
      "light",
    );
    await page.screenshot({
      path: path.join(output, "settings-light.png"),
      fullPage: true,
    });
    await page.goto("http://localhost:5178/");
    await page
      .getByRole("heading", { name: "Less guesswork. More control." })
      .waitFor();
    await page.screenshot({
      path: path.join(output, "landing-light.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(output, "landing-light-mobile.png"),
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      "landing must fit mobile width",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("http://localhost:5178/settings");
    await page.getByRole("switch", { name: "Night mode" }).click();
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "dark",
    );
    await page.goto("http://localhost:5178/");
    await page
      .getByRole("heading", { name: "Less guesswork. More control." })
      .waitFor();
    await page.screenshot({
      path: path.join(output, "landing-dark.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(output, "landing-dark-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("http://localhost:5178/settings");
    await page.getByRole("heading", { name: "Your profile" }).waitFor();

    assert.equal(
      await page.getByRole("heading", { name: "Team access" }).count(),
      0,
    );
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("**/login");
    await page.getByLabel("Email Address").fill("admin@example.com");
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.waitForURL("**/settings");
    await page.getByLabel("Email", { exact: true }).fill("new@example.com");
    await page.getByRole("button", { name: "Create invitation" }).click();
    await page.getByLabel("Invitation link").waitFor();
    assert.match(
      await page.getByLabel("Invitation link").inputValue(),
      /register\?token=/,
    );
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Revoke", exact: true }).click();
    await page.getByText("Invitation revoked.").waitFor();
    await page
      .getByRole("row")
      .filter({ hasText: "staff@example.com" })
      .getByRole("button", { name: "Deactivate", exact: true })
      .click();
    await page.getByText("Access updated.").waitFor();
    assert.equal(
      users.find((u) => u.email === "staff@example.com").isActive,
      false,
    );
    await page.screenshot({
      path: path.join(output, "settings-desktop.png"),
      fullPage: true,
    });
    for (const theme of ["light", "dark"]) {
      await page.evaluate(
        (value) => localStorage.setItem("stockforge-theme", value),
        theme,
      );
      for (const width of [320, 390, 768]) {
        await page.setViewportSize({ width, height: 844 });
        for (const route of [
          "/",
          "/dashboard",
          "/products",
          "/movements",
          "/reports",
          "/settings",
          "/login",
          "/register",
        ]) {
          await page.goto(`http://localhost:5178${route}`);
          await page.waitForLoadState("networkidle");
          const overflow = await page.evaluate(() => ({
            width: window.innerWidth,
            content: document.documentElement.scrollWidth,
            elements: [...document.querySelectorAll("body *")]
              .filter(
                (el) =>
                  el.getBoundingClientRect().right > window.innerWidth + 1 &&
                  getComputedStyle(el).position !== "absolute",
              )
              .slice(0, 6)
              .map((el) => `${el.tagName}.${el.className}`),
          }));
          assert.ok(
            overflow.content <= width,
            `${route} ${theme} ${width}px overflow: ${JSON.stringify(overflow)}`,
          );
          if (
            width === 390 &&
            theme === "dark" &&
            ["/", "/products", "/settings"].includes(route)
          )
            await page.screenshot({
              path: path.join(
                output,
                `phone-${route.slice(1) || "landing"}.png`,
              ),
              fullPage: true,
            });
          if (route === "/products" && width === 320) {
            await page
              .getByRole("button", { name: "Add Product", exact: true })
              .click();
            await page.getByLabel("Product Name", { exact: true }).waitFor();
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth,
              ),
              "mobile add form fits",
            );
            await page
              .getByRole("button", { name: "Cancel", exact: true })
              .click();

            await page
              .getByRole("button", { name: "Open menu", exact: true })
              .click();
            await page
              .getByRole("link", { name: "Stock Movements", exact: true })
              .click();
            await page
              .getByRole("heading", { name: "Stock Movements", exact: true })
              .waitFor();
            assert.equal(
              await page
                .getByRole("button", { name: "Open menu", exact: true })
                .getAttribute("aria-expanded"),
              "false",
            );
          }
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("http://localhost:5178/missing-page");
    await page.getByRole("heading", { name: "Page not found" }).waitFor();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: protected routes, staff create/edit/stock, history, CSV download, responsive layout, profile, logout/login, admin invitation/revoke/access, 404; no browser errors.",
    );
  } finally {
    if (browser) await browser.close();
    await Promise.all([
      new Promise((r) => {
        api.close(r);
        api.closeAllConnections();
      }),
      new Promise((r) => {
        frontend.close(r);
        frontend.closeAllConnections();
      }),
    ]);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
