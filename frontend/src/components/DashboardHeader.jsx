import { Bell, CircleUserRound } from "lucide-react";

function DashboardHeader() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 pb-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>

        <p className="mt-2 text-sm text-slate-400">
          Here's your inventory overview.
        </p>
      </div>

      <div className="flex items-center gap-5">
        <Bell size={21} className="text-slate-400" />

        <div className="flex items-center gap-3">
          <CircleUserRound size={32} className="text-blue-400" />

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white">Demo User</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
