import { Link } from "react-router-dom";
import Navbar from "../Components/Navbar";

function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main>
        <section className="mx-auto max-w-6xl px-6 py-28 text-center">
          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
            Smarter Inventory Management
          </span>

          <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-6xl">
            Take Control of Your{" "}
            <span className="text-blue-500">Inventory.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Manage your products, track stock levels, and monitor your inventory
            from one powerful dashboard. Simple, organized, and built for
            growing businesses.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-7 py-3 font-medium hover:bg-blue-700"
            >
              Get Started Free
            </Link>

            <a
              href="#features"
              className="rounded-lg border border-slate-700 px-7 py-3 font-medium hover:bg-slate-800"
            >
              Explore Features
            </a>
          </div>
        </section>

        <section
          id="features"
          className="border-t border-slate-800 px-6 py-20 text-center"
        >
          <h2 className="text-3xl font-bold">
            Everything you need to manage inventory
          </h2>

          <p className="mt-4 text-slate-400">
            Product tracking, stock monitoring, and insights in one place.
          </p>
        </section>
      </main>
    </div>
  );
}

export default Landing;
