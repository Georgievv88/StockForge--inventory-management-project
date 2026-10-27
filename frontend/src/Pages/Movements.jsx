import { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import { apiJson } from "../lib/api";
import { dateTime } from "../lib/format";

const labels = {
  opening: "Opening stock",
  in: "Stock in",
  out: "Stock out",
  adjustment: "Stock count",
  deleted: "Product deleted",
};
export default function Movements() {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState({ items: [], pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [revision, setRevision] = useState(0);
  const [form, setForm] = useState({
    productId: "",
    type: "in",
    quantity: "",
    reason: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiJson("/products", { signal: controller.signal }),
      apiJson(
        `/movements?${new URLSearchParams({ page, type: filter, search: query })}`,
        { signal: controller.signal },
      ),
    ])
      .then(([items, result]) => {
        setProducts(items);
        setHistory(result);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, filter, query, revision]);
  const selected = products.find((p) => p._id === form.productId);
  function reload() {
    setLoading(true);
    setError("");
    setRevision((v) => v + 1);
  }
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await apiJson("/movements", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          expectedVersion: selected?.__v || 0,
        }),
      });
      setForm((v) => ({ ...v, quantity: "", reason: "" }));
      setNotice("Stock updated and movement recorded.");
      reload();
    } catch (err) {
      setError(err.message);
      if (err.status === 409) setRevision((v) => v + 1);
    } finally {
      setSaving(false);
    }
  }
  const field = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return (
    <PageShell
      title="Stock Movements"
      description="Receive stock, record removals, and reconcile physical counts. Every change has an audit trail."
    >
      <form onSubmit={submit} className="panel mt-8 grid gap-4 md:grid-cols-2">
        <label>
          Product
          <select
            aria-label="Product"
            required
            name="productId"
            value={form.productId}
            onChange={field}
          >
            <option value="">Choose a product</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} · {p.sku}
              </option>
            ))}
          </select>
        </label>
        <label>
          Movement type
          <select
            aria-label="Movement type"
            name="type"
            value={form.type}
            onChange={field}
          >
            <option value="in">Stock in — add units</option>
            <option value="out">Stock out — remove units</option>
            <option value="adjustment">Stock count — set exact quantity</option>
          </select>
        </label>
        <label>
          {form.type === "adjustment" ? "Counted quantity" : "Units"}
          <input
            required
            type="number"
            min={form.type === "adjustment" ? 0 : 1}
            max="1000000000000"
            step="1"
            name="quantity"
            value={form.quantity}
            onChange={field}
          />
        </label>
        <label>
          Reason
          <input
            required
            maxLength={500}
            name="reason"
            placeholder="e.g. Delivery received, damaged stock, physical count"
            value={form.reason}
            onChange={field}
          />
        </label>
        <div className="flex flex-wrap items-center gap-4 md:col-span-2">
          <button className="primary" disabled={saving || loading || !selected}>
            {saving ? "Recording..." : "Record movement"}
          </button>
          <span className="text-muted">
            {selected
              ? `Current stock: ${selected.quantity} units`
              : "Select a product to see its current stock."}
          </span>
        </div>
      </form>
      {notice && (
        <p role="status" className="mt-4 text-success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-danger">
          {error}
        </p>
      )}
      <section className="panel mt-6">
        <div className="flex flex-wrap items-end gap-4">
          <h2 className="mr-auto text-xl font-semibold">Movement history</h2>
          <button className="secondary" onClick={reload}>
            Refresh
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setPage(1);
            setQuery(search);
            setRevision((v) => v + 1);
          }}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <label className="flex-1">
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Product or SKU"
            />
          </label>
          <label>
            Type
            <select
              aria-label="Filter movement type"
              value={filter}
              onChange={(e) => {
                setLoading(true);
                setPage(1);
                setFilter(e.target.value);
              }}
            >
              <option value="">All movements</option>
              {Object.entries(labels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary">Search</button>
        </form>
        {loading ? (
          <p className="mt-5">Loading movements...</p>
        ) : (
          <>
            <div className="mt-5 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      "When",
                      "Product",
                      "Type",
                      "Change",
                      "Before → After",
                      "Reason",
                      "By",
                    ].map((v) => (
                      <th key={v}>{v}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.items.map((m) => (
                    <tr key={m._id}>
                      <td>{dateTime(m.createdAt)}</td>
                      <td>
                        {m.productName}
                        <small className="block text-muted">{m.sku}</small>
                      </td>
                      <td>{labels[m.type]}</td>
                      <td
                        className={
                          m.delta < 0 ? "text-warning" : "text-success"
                        }
                      >
                        {m.delta > 0 ? "+" : ""}
                        {m.delta}
                      </td>
                      <td>
                        {m.before} → {m.after}
                      </td>
                      <td>{m.reason}</td>
                      <td>{m.actorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {history.items.length === 0 && (
              <p className="py-8 text-muted">
                No movements found. New quantity changes will appear here.
              </p>
            )}
          </>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            className="secondary"
            disabled={page === 1 || loading}
            onClick={() => {
              setLoading(true);
              setPage(page - 1);
            }}
          >
            Previous
          </button>
          <span>
            Page {page} of {history.pages} · {history.total} movements
          </span>
          <button
            className="secondary"
            disabled={page >= history.pages || loading}
            onClick={() => {
              setLoading(true);
              setPage(page + 1);
            }}
          >
            Next
          </button>
        </div>
      </section>
    </PageShell>
  );
}
