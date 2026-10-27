import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";
import { apiJson } from "../lib/api";
import { money, dateTime, downloadCsv } from "../lib/format";

export default function Reports() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    apiJson("/reports", { signal: controller.signal })
      .then(setReport)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  function exportRows(lowStock = false) {
    const rows = lowStock ? report.lowStock : report.products;
    downloadCsv(
      lowStock ? "stockforge-low-stock.csv" : "stockforge-inventory.csv",
      [
        [
          "SKU",
          "Product",
          "Category",
          "Unit cost (MKD)",
          "Price (MKD)",
          "Quantity",
          "Low stock threshold",
          "Cost value (MKD)",
        ],
        ...rows.map((p) => [
          p.sku,
          p.name,
          p.category,
          p.cost,
          p.price,
          p.quantity,
          p.lowStockThreshold,
          p.cost * p.quantity,
        ]),
      ],
    );
  }
  return (
    <PageShell
      title="Reports"
      description="A current snapshot of inventory value, category totals, and replenishment needs."
    >
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="secondary"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setError("");
            setRevision((v) => v + 1);
          }}
        >
          Refresh report
        </button>
        <button
          className="primary"
          disabled={!report || loading || !!error}
          onClick={() => exportRows()}
        >
          Export inventory CSV
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-danger">
          {error}
        </p>
      )}
      {loading && <p className="mt-6">Loading report...</p>}
      {report && !loading && !error && (
        <>
          <p className="mt-4 text-sm text-muted">
            Generated {dateTime(report.generatedAt)} · Currency: MKD
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Products", report.totals.products],
              ["Units on hand", report.totals.units],
              ["Inventory at cost", money(report.totals.costValue)],
              ["Inventory at retail", money(report.totals.retailValue)],
            ].map(([label, value]) => (
              <div className="panel" key={label}>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-3 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            Potential gross margin: {money(report.totals.potentialMargin)}. This
            is retail value minus cost for stock on hand, not realized revenue
            or profit.
          </p>
          <section className="panel mt-6">
            <h2 className="text-xl font-semibold">Inventory by category</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Products</th>
                    <th>Units</th>
                    <th>Cost value</th>
                    <th>Share of value</th>
                  </tr>
                </thead>
                <tbody>
                  {report.categories.map((c) => (
                    <tr key={c.category}>
                      <td>{c.category}</td>
                      <td>{c.products}</td>
                      <td>{c.units}</td>
                      <td>{money(c.costValue)}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 rounded bg-raised">
                            <div
                              className="h-2 rounded bg-accent"
                              style={{
                                width: `${report.totals.costValue ? (c.costValue / report.totals.costValue) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          {report.totals.costValue
                            ? Math.round(
                                (c.costValue / report.totals.costValue) * 100,
                              )
                            : 0}
                          %
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!report.categories.length && (
              <p className="mt-4 text-muted">
                Add your first product to start reporting.
              </p>
            )}
          </section>
          <section className="panel mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">
                Low stock · {report.lowStock.length} products
              </h2>
              <button
                className="secondary"
                disabled={!report.lowStock.length}
                onClick={() => exportRows(true)}
              >
                Export low stock CSV
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>On hand</th>
                    <th>Threshold</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.lowStock.map((p) => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{p.sku}</td>
                      <td>{p.quantity}</td>
                      <td>{p.lowStockThreshold}</td>
                      <td
                        className={
                          p.quantity === 0 ? "text-danger" : "text-warning"
                        }
                      >
                        {p.quantity === 0 ? "Out of stock" : "Low stock"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!report.lowStock.length && (
              <p className="mt-4 text-muted">
                No products at or below their low-stock threshold.
              </p>
            )}
            <Link className="mt-5 inline-block text-accent" to="/movements">
              Record a stock receipt →
            </Link>
          </section>
        </>
      )}
    </PageShell>
  );
}
