const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const crypto = require("node:crypto");
process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-characters";
const app = require("../app");
const User = require("../models/User");
const Product = require("../models/Products");
const Invitation = require("../models/Invitation");
const Movement = require("../models/Movement");
let movements;
function query(value) {
  return {
    sort() {
      return this;
    },
    select() {
      return this;
    },
    session() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    lean() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
}
const sample = {
  name: "Sample",
  sku: "TEST-001",
  category: "Storage",
  cost: 100,
  price: 150,
  quantity: 8,
  lowStockThreshold: 5,
};
let product;
const id = "507f1f77bcf86cd799439011";
let server, base, user, passwordHash;
const token = (options = {}) =>
  jwt.sign({ userId: id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
    ...options,
  });
async function request(path, { method = "GET", body, cookie, origin } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(3000),
  });
  return {
    status: response.status,
    body: await response.json(),
    cookie: response.headers.get("set-cookie"),
  };
}
const adminCookie = () => `stockify_token=${token()}`;

before(async () => {
  passwordHash = await bcrypt.hash("valid-password-123", 4);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(
  () =>
    new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    }),
);
beforeEach(() => {
  user = new User({
    _id: id,
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
    password: passwordHash,
  });
  User.findById = async () => user;
  User.findOne = () => ({ select: async () => user });
  User.exists = async () => null;
  movements = [];
  product = new Product({ _id: id, ...sample, __v: 0 });
  product.save = async () => product;
  Product.find = () => query([product]);
  Product.findById = () => query(product);
  Product.create = async ([body]) => [
    new Product({ _id: id, ...body, __v: 0 }),
  ];
  Product.deleteOne = async () => ({ deletedCount: 1 });
  Movement.create = async (values) => {
    movements.push(...values);
    return values;
  };
  Movement.find = () => query(movements);
  Movement.countDocuments = async () => movements.length;
  mongoose.connection.transaction = async (fn) => fn({});
});

test("anonymous requests cannot read or mutate inventory", async () => {
  for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
    const result = await request(
      `/products${["PATCH", "DELETE"].includes(method) ? `/${id}` : ""}`,
      {
        method,
        body: method === "POST" || method === "PATCH" ? {} : undefined,
      },
    );
    assert.equal(result.status, 401);
  }
});
test("login route accepts valid credentials and sets HTTP-only cookie", async () => {
  const result = await request("/auth/login", {
    method: "POST",
    body: { email: "Admin@example.com", password: "valid-password-123" },
  });
  assert.equal(result.status, 200);
  assert.match(result.cookie, /HttpOnly/i);
  assert.equal(result.body.user.role, "admin");
  assert.equal(result.body.user.password, undefined);
  const session = await request("/auth/me", {
    cookie: result.cookie.split(";")[0],
  });
  assert.equal(session.status, 200);
  assert.equal(session.body.user.email, "admin@example.com");
});
test("wrong passwords, invalid input and inactive users are rejected", async () => {
  assert.equal(
    (
      await request("/auth/login", {
        method: "POST",
        body: { email: "admin@example.com", password: "wrong" },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/auth/login", {
        method: "POST",
        body: { email: "admin@example.com", password: 123 },
      })
    ).status,
    400,
  );
  user.isActive = false;
  assert.equal(
    (
      await request("/auth/login", {
        method: "POST",
        body: { email: "admin@example.com", password: "valid-password-123" },
      })
    ).status,
    401,
  );
  assert.equal(
    (await request("/auth/me", { cookie: adminCookie() })).status,
    401,
  );
});
test("expired and tampered sessions are rejected", async () => {
  assert.equal(
    (
      await request("/auth/me", {
        cookie: `stockify_token=${token({ expiresIn: -1 })}`,
      })
    ).status,
    401,
  );
  assert.equal(
    (await request("/auth/me", { cookie: "stockify_token=invalid" })).status,
    401,
  );
});
test("staff can read, create, edit and adjust stock but cannot delete or invite", async () => {
  user.role = "staff";
  assert.equal(
    (await request("/products", { cookie: adminCookie() })).status,
    200,
  );
  const created = await request("/products", {
    method: "POST",
    cookie: adminCookie(),
    body: sample,
  });
  assert.equal(created.status, 201);
  assert.equal(movements[0].type, "opening");
  const edited = await request(`/products/${id}`, {
    method: "PATCH",
    cookie: adminCookie(),
    body: { name: "Updated product", quantity: 3, expectedVersion: 0 },
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.name, "Updated product");
  assert.equal(edited.body.quantity, 3);
  assert.equal(movements[1].delta, -5);
  for (const [path, method] of [
    [`/products/${id}`, "DELETE"],
    ["/auth/invitations", "POST"],
  ]) {
    assert.equal(
      (await request(path, { method, cookie: adminCookie(), body: {} })).status,
      403,
    );
  }
});
test("invalid products, stale edits and duplicate SKUs return promptly", async () => {
  assert.equal(
    (
      await request("/products", {
        method: "POST",
        cookie: adminCookie(),
        body: { ...sample, quantity: 1.5 },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`/products/${id}`, {
        method: "PATCH",
        cookie: adminCookie(),
        body: { quantity: -1, expectedVersion: 0 },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`/products/${id}`, {
        method: "PATCH",
        cookie: adminCookie(),
        body: { quantity: 2, expectedVersion: 99 },
      })
    ).status,
    409,
  );
  assert.equal(product.quantity, 8);
  Product.create = async () => {
    throw Object.assign(new Error(), { code: 11000 });
  };
  assert.equal(
    (
      await request("/products", {
        method: "POST",
        cookie: adminCookie(),
        body: sample,
      })
    ).status,
    409,
  );
});
test("database failures produce JSON errors", async () => {
  Product.find = () => {
    throw new Error("Simulated database failure");
  };
  const result = await request("/products", { cookie: adminCookie() });
  assert.equal(result.status, 500);
  assert.equal(
    result.body.message,
    "Unable to complete the request. Please try again.",
  );
});
test("admin invitation stores a hash and supplies an expiring link", async () => {
  let saved;
  Invitation.create = async (value) => {
    saved = value;
  };
  const result = await request("/auth/invitations", {
    method: "POST",
    cookie: adminCookie(),
    body: { email: "New@example.com", role: "staff" },
  });
  assert.equal(result.status, 201);
  const raw = new URL(result.body.invitationUrl).searchParams.get("token");
  assert.equal(
    saved.tokenHash,
    crypto.createHash("sha256").update(raw).digest("hex"),
  );
  assert.equal(saved.email, "new@example.com");
  assert.equal(saved.role, "staff");
  assert.ok(saved.expiresAt > new Date());
});
test("invitation acceptance uses invited identity and rejects reuse", async () => {
  const invitation = { _id: id, email: "invited@example.com", role: "staff" };
  let used = false,
    created,
    ended = false;
  Invitation.findOne = () => ({
    select: async () => (used ? null : invitation),
  });
  User.findOne = async () => null;
  Invitation.findOneAndUpdate = async () => {
    used = true;
    return invitation;
  };
  User.create = async ([value]) => {
    created = value;
  };
  mongoose.startSession = async () => ({
    withTransaction: async (fn) => fn(),
    endSession: async () => {
      ended = true;
    },
  });
  const body = {
    token: "invitation-token",
    name: " Teammate ",
    password: "valid-password-123",
    role: "admin",
    email: "forged@example.com",
  };
  assert.equal(
    (await request("/auth/accept-invitation", { method: "POST", body })).status,
    201,
  );
  assert.equal(created.email, invitation.email);
  assert.equal(created.role, "staff");
  assert.equal(created.name, "Teammate");
  assert.ok(await bcrypt.compare(body.password, created.password));
  assert.ok(ended);
  assert.equal(
    (await request("/auth/accept-invitation", { method: "POST", body })).status,
    400,
  );
});
test("logout clears cookie and foreign-origin writes are denied", async () => {
  const result = await request("/auth/logout", { method: "POST" });
  assert.equal(result.status, 200);
  assert.match(result.cookie, /Expires=Thu, 01 Jan 1970/);
  assert.equal(
    (
      await request("/products", {
        method: "POST",
        cookie: adminCookie(),
        origin: "https://foreign.example",
        body: {},
      })
    ).status,
    403,
  );
});

test("stock receipts, removals and counts record signed deltas", async () => {
  user.role = "staff";
  for (const [type, quantity, expectedVersion, after, delta] of [
    ["in", 4, 0, 12, 4],
    ["out", 2, 1, 10, -2],
    ["adjustment", 0, 2, 0, -10],
  ]) {
    const result = await request("/movements", {
      method: "POST",
      cookie: adminCookie(),
      body: {
        productId: id,
        type,
        quantity,
        expectedVersion,
        reason: "Physical stock check",
      },
    });
    assert.equal(result.status, 201);
    assert.equal(result.body.quantity, after);
    assert.equal(movements.at(-1).delta, delta);
    assert.equal(movements.at(-1).actorName, user.name);
  }
});
test("overselling, fractional counts, unchanged counts and stale stock are rejected", async () => {
  for (const [type, quantity, expectedVersion, status] of [
    ["out", 9, 0, 400],
    ["in", 1.5, 0, 400],
    ["adjustment", 8, 0, 400],
    ["in", 2, 1, 409],
  ]) {
    const result = await request("/movements", {
      method: "POST",
      cookie: adminCookie(),
      body: { productId: id, type, quantity, expectedVersion, reason: "Count" },
    });
    assert.equal(result.status, status);
  }
  assert.equal(movements.length, 0);
  assert.equal(product.quantity, 8);
});
test("delete keeps the product snapshot in history", async () => {
  const result = await request(`/products/${id}`, {
    method: "DELETE",
    cookie: adminCookie(),
  });
  assert.equal(result.status, 200);
  assert.equal(movements[0].type, "deleted");
  assert.equal(movements[0].sku, sample.sku);
  assert.equal(movements[0].delta, -8);
});
test("reports calculate totals and include zero stock", async () => {
  Product.find = () =>
    query([
      { ...sample, _id: id },
      { ...sample, _id: "second", quantity: 0 },
    ]);
  const result = await request("/reports", { cookie: adminCookie() });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.totals, {
    products: 2,
    units: 8,
    costValue: 800,
    retailValue: 1200,
    potentialMargin: 400,
  });
  assert.equal(result.body.lowStock.length, 1);
  assert.equal(result.body.categories[0].products, 2);
});
test("movement pagination returns totals and validates filters", async () => {
  assert.equal(
    (await request("/movements?type=invalid", { cookie: adminCookie() }))
      .status,
    400,
  );
  const result = await request("/movements?page=1&search=%5B", {
    cookie: adminCookie(),
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.page, 1);
  assert.equal(result.body.total, 0);
});
test("staff cannot read team data or change roles", async () => {
  user.role = "staff";
  for (const [path, method] of [
    ["/settings/users", "GET"],
    ["/settings/invitations", "GET"],
    [`/settings/users/${id}`, "PATCH"],
    [`/settings/invitations/${id}`, "DELETE"],
  ]) {
    assert.equal(
      (
        await request(path, {
          method,
          cookie: adminCookie(),
          body: method === "PATCH" ? {} : undefined,
        })
      ).status,
      403,
    );
  }
});
test("admin cannot deactivate or demote self", async () => {
  assert.equal(
    (
      await request(`/settings/users/${id}`, {
        method: "PATCH",
        cookie: adminCookie(),
        body: { role: "staff", isActive: false },
      })
    ).status,
    400,
  );
});
test("profile updates cannot grant administrator access", async () => {
  user.role = "staff";
  User.findByIdAndUpdate = async (userId, update) => {
    assert.deepEqual(update, { $set: { name: "New Name" } });
    return { ...user.toObject(), name: "New Name" };
  };
  const result = await request("/settings/profile", {
    method: "PATCH",
    cookie: adminCookie(),
    body: { name: "New Name", role: "admin" },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.role, "staff");
});
test("changing password invalidates previous session tokens", async () => {
  User.findById = () => query(user);
  User.updateOne = async (filter, update) => {
    assert.equal(filter.password, passwordHash);
    assert.ok(await bcrypt.compare("new-password-123", update.$set.password));
    user.tokenVersion += update.$inc.tokenVersion;
    return { modifiedCount: 1 };
  };
  const cookie = adminCookie();
  const wrong = await request("/settings/password", {
    method: "POST",
    cookie,
    body: { currentPassword: "wrong", password: "new-password-123" },
  });
  assert.equal(wrong.status, 400);
  const result = await request("/settings/password", {
    method: "POST",
    cookie,
    body: {
      currentPassword: "valid-password-123",
      password: "new-password-123",
    },
  });
  assert.equal(result.status, 200);
  assert.equal((await request("/auth/me", { cookie })).status, 401);
});
