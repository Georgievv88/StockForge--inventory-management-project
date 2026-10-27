import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  BarChart3,
  Settings,
  LogOut,
  Boxes,
  Menu,
  X,
} from "lucide-react";

import { NavLink, Link } from "react-router-dom";

const menuitems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Products", path: "/products", icon: Package },
  { name: "Stock Movements", path: "/movements", icon: ArrowLeftRight },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Settings", path: "/settings", icon: Settings },
];
import { useState } from "react";
import { useAuth } from "../auth/context";
function Sidebar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  async function handleLogout() {
    setLeaving(true);
    setError("");
    try {
      await logout();
    } catch (err) {
      setError(err.message);
    } finally {
      setLeaving(false);
    }
  }
  return (
    <aside className="flex w-full shrink-0 flex-col lg:min-h-screen lg:w-64 border-r border-line bg-surface p-5 text-ink">
      <div className="flex items-center justify-between gap-3 lg:mb-12">
        <Link to="/" className="flex items-center gap-3">
          <Boxes className="text-accent" size={30} />
          <span className="text-2xl font-bold">Stockify</span>
        </Link>
        <button
          type="button"
          className="secondary lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="workspace-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <div
        id="workspace-navigation"
        className={`${menuOpen ? "flex" : "hidden"} mt-5 flex-1 flex-col lg:mt-0 lg:flex`}
      >
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-subtle">
          Workspace
        </p>

        <nav
          aria-label="Workspace navigation"
          className="flex flex-1 flex-row flex-wrap gap-2 lg:flex-col"
        >
          {menuitems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                    isActive
                      ? "bg-brand text-ink"
                      : "text-muted hover:bg-raised hover:text-ink"
                  }`
                }
              >
                <Icon size={19} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          disabled={leaving}
          className="mt-6 flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-muted hover:bg-raised hover:text-ink"
        >
          <LogOut size={19} />
          {leaving ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
