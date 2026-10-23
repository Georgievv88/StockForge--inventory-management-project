function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>

        <div className="rounded-lg bg-blue-500/10 p-3">
          <Icon size={22} className="text-blue-400" />
        </div>
      </div>

      <h2 className="mt-4 text-3xl font-bold text-white">{value}</h2>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

export default StatCard;
