import Sidebar from "./Sidebar";
export default function PageShell({ title, description, children }) {
  return (
    <div className="min-h-screen bg-canvas text-ink lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="mt-2 text-muted">{description}</p>}
        {children}
      </main>
    </div>
  );
}
