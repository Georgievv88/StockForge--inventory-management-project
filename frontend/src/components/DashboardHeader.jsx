import { CircleUserRound } from "lucide-react";

import { useAuth } from "../auth/context";

function DashboardHeader() {
  const { user } = useAuth();
  return (
    <header className="flex items-center justify-between border-b border-line pb-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Dashboard</h1>

        <p className="mt-2 text-sm text-muted">
          Here's your inventory overview.
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <CircleUserRound size={32} className="text-accent" />

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-ink">{user.name}</p>
            <p className="text-xs text-muted">
              {user.role === "admin" ? "Administrator" : "Staff"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
