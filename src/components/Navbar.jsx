import { Link } from "react-router-dom";
import { Package } from "lucide-react";

function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-slate-800 px-8 py-5">
      <Link to="/" className="flex items-center gap-2">
        <Package className="text-blue-500" size={28} />
        <span className="text-2xl font-bold text-white">StockForge</span>
      </Link>

      <div className="flex items-center gap-6">
        <a href="#features" className="text-slate-300 hover:text-white">
          Features
        </a>

        <Link to="/login" className="text-slate-300 hover:text-white">
          Login
        </Link>

        <Link
          to="/register"
          className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
