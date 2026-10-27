import { Link, useNavigate, useLocation } from "react-router-dom";
import { Package } from "lucide-react";
import { useState } from "react";

import { useAuth } from "../auth/context";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await login(email, password);
      navigate(
        [
          "/dashboard",
          "/products",
          "/movements",
          "/reports",
          "/settings",
        ].includes(location.state?.from)
          ? location.state.from
          : "/dashboard",
        { replace: true },
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 text-ink">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <Package size={32} className="text-accent" />
          <span className="text-3xl font-bold">Stockify</span>
        </Link>

        <div className="rounded-xl border border-line bg-surface p-8 shadow-xl">
          <h1 className="text-2xl font-bold">Welcome back</h1>

          <p className="mt-2 text-sm text-muted">
            Sign in to manage your inventory.
          </p>

          {location.state?.passwordChanged && (
            <p role="status" className="mt-4 text-success">
              Password changed. Sign in with your new password.
            </p>
          )}
          {location.state?.registered && (
            <p role="status" className="mt-4 text-success">
              Account created. Sign in with your invited email.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 text-danger">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-lg border border-line-strong bg-raised px-4 py-3 outline-none focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm">
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-line-strong bg-raised px-4 py-3 outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full cursor-pointer rounded-lg bg-brand py-3 font-semibold transition hover:bg-brand-hover"
            >
              {saving ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Have an invitation?{" "}
            <Link to="/register" className="text-accent hover:underline">
              Accept invitation
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

export default Login;
