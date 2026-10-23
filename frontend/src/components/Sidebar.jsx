import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  BarChart3,
  Settings,
  LogOut,
  Boxes,
} from "lucide-react";

import { NavLink, Link } from "react-router-dom";

const menuitems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Products", path: "/products", icon: Package },
  { name: "Stock Movements", path: "/movements", icon: ArrowLeftRight },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Settings", path: "/settings", icon: Settings },
];
function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 p-5 text-white">
      <Link to="/" className="mb-12 flex items-center gap-3">
        <Boxes className="text-blue-500" size={30} />
        <span className="text-2xl font-bold">StockForge</span>
      </Link>

      <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Workspace
      </p>

      <nav className="flex flex-1 flex-col gap-2">
        {menuitems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={19} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <Link
        to="/login"
        className="mt-6 flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
      >
        <LogOut size={19} />
        Back to Login
      </Link>
    </aside>
  );
}

export default Sidebar;
