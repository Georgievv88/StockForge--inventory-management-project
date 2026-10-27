import { Link } from "react-router-dom";
import { Boxes, ArrowUpRight } from "lucide-react";
import { useAuth } from "../auth/context";
export default function Navbar() {
  const { user } = useAuth();
  return (
    <header className="landing-nav">
      <nav aria-label="Main navigation" className="landing-container">
        <Link to="/" className="landing-logo">
          <span>
            <Boxes size={24} />
          </span>
          StockForge<span className="logo-period">.</span>
        </Link>
        <div className="flex items-center gap-5">
          <a href="#features" className="nav-features">
            Features
          </a>
          <Link className="nav-signin" to={user ? "/dashboard" : "/login"}>
            {user ? "Dashboard" : "Sign in"}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
