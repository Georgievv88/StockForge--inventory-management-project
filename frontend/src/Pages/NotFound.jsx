import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas p-6 text-ink">
      <p className="text-accent">404</p>
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted">This page does not exist or has moved.</p>
      <Link className="primary" to="/dashboard">
        Go to dashboard
      </Link>
    </main>
  );
}
