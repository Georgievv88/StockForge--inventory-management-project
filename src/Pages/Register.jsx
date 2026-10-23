import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { useState } from "react";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
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
  function handleSubmit(e) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords dont match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    console.log("Registration validated");
  }
  const inputStyle =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <Package size={32} className="text-blue-500" />
          <span className="text-3xl font-bold">StockForge</span>
        </Link>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <h1 className="text-2xl font-bold">Create an account</h1>

          <p className="mt-2 text-sm text-slate-400">
            Start managing your inventory with StockForge.
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
              <label htmlFor="register-email" className="mb-2 block text-sm">
                Email Address
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
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
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
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
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full cursor-pointer rounded-lg bg-blue-600 py-3 font-semibold transition hover:bg-blue-700"
            >
              Create Account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 block text-center text-sm text-slate-400 hover:text-white"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
export default Register;
