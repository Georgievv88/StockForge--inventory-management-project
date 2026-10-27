import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Package } from "lucide-react";
import { useState } from "react";

import { apiJson } from "../lib/api";

function Register() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    token: params.get("token") || "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError("");
  }
  async function handleSubmit(e) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords dont match.");
      return;
    }
    if (
      form.password.length < 12 ||
      new TextEncoder().encode(form.password).length > 72
    ) {
      setError(
        "Password must be at least 12 characters and at most 72 UTF-8 bytes",
      );
      return;
    }
    setError("");
    setSaving(true);
    try {
      await apiJson("/auth/accept-invitation", {
        method: "POST",
        body: JSON.stringify({
          token: form.token.trim(),
          name: form.name,
          password: form.password,
        }),
      });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  const inputStyle =
    "w-full rounded-lg border border-line-strong bg-raised px-4 py-3 outline-none focus:border-accent";

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10 text-ink">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <Package size={32} className="text-accent" />
          <span className="text-3xl font-bold">StockForge</span>
        </Link>

        <div className="rounded-xl border border-line bg-surface p-8 shadow-xl">
          <h1 className="text-2xl font-bold">Create an account</h1>

          <p className="mt-2 text-sm text-muted">
            Use the invitation link or code from your administrator. Your
            account uses the email they invited.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                required
                autoComplete="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                className={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="invitation-token" className="mb-2 block text-sm">
                Invitation Code
              </label>
              <input
                id="invitation-token"
                name="token"
                type="text"
                required
                autoComplete="off"
                placeholder="Paste your invitation code"
                value={form.token}
                onChange={handleChange}
                className={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="register-password" className="mb-2 block text-sm">
                Password
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                placeholder="At least 12 characters"
                value={form.password}
                onChange={handleChange}
                className={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
                className={inputStyle}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full cursor-pointer rounded-lg bg-brand py-3 font-semibold transition hover:bg-brand-hover"
            >
              {saving ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 block text-center text-sm text-muted hover:text-ink"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
export default Register;
