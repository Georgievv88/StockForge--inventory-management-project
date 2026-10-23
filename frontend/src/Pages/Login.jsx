import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <Package size={32} className="text-blue-500" />
          <span className="text-3xl font-bold">StockForge</span>
        </Link>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <h1 className="text-2xl font-bold">Welcome back</h1>

          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage your inventory.
          </p>

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
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer rounded-lg bg-blue-600 py-3 font-semibold transition hover:bg-blue-700"
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-400 hover:underline">
              Sign up
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

export default Login;
