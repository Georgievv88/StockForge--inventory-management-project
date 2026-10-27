function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-6 transition hover:border-line-strong">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{title}</p>

        <div className="rounded-lg bg-accent/10 p-3">
          <Icon size={22} className="text-accent" />
        </div>
      </div>

      <h2 className="mt-4 text-3xl font-bold text-ink">{value}</h2>

      <p className="mt-2 text-xs text-subtle">{description}</p>
    </div>
  );
}

export default StatCard;
