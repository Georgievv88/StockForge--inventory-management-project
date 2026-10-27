import InviteUser from "../components/InviteUser";
import { useAuth } from "../auth/context";
import { apiFetch } from "../lib/api";
import { useState, useEffect } from "react";
import { Package, Boxes, AlertTriangle, Wallet } from "lucide-react";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/StatCard";

function Dashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        const response = await apiFetch("/products", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard products");
        }

        const data = await response.json();
        setProducts(data);
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => controller.abort();
  }, []);

  const totalProducts = products.length;

  const totalUnits = products.reduce(
    (total, product) => total + product.quantity,
    0,
  );

  const lowStockProducts = products.filter(
    (product) => product.quantity <= product.lowStockThreshold,
  ).length;

  const inventoryValue = products.reduce(
    (total, product) => total + product.cost * product.quantity,
    0,
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("mk-MK", {
      style: "currency",
      currency: "MKD",
    }).format(value);

  return (
    <div className="min-h-screen bg-canvas text-ink lg:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-5 md:p-8">
        <DashboardHeader />
        {user.role === "admin" && <InviteUser />}

        {loading && <p className="mt-5 text-accent">Loading dashboard...</p>}

        {error && (
          <p role="alert" className="mt-5 text-danger">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Products"
                value={totalProducts}
                icon={Package}
              />

              <StatCard title="Total Units" value={totalUnits} icon={Boxes} />

              <StatCard
                title="Low Stock Products"
                value={lowStockProducts}
                icon={AlertTriangle}
              />

              <StatCard
                title="Inventory Value"
                value={formatCurrency(inventoryValue)}
                icon={Wallet}
              />
            </div>

            <div className="mt-8 rounded-xl border border-line bg-surface p-6">
              <h2 className="text-xl font-semibold">Recent Products</h2>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line-strong text-muted">
                    <tr>
                      <th className="p-4">Product</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Quantity</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...products]
                      .sort(
                        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
                      )
                      .slice(0, 5)
                      .map((product) => (
                        <tr
                          key={product._id}
                          className="border-b border-line hover:bg-raised/50"
                        >
                          <td className="p-4 font-medium">{product.name}</td>

                          <td className="p-4 text-muted">{product.sku}</td>

                          <td className="p-4">{product.category}</td>

                          <td className="p-4">
                            {formatCurrency(product.price)}
                          </td>

                          <td className="p-4">{product.quantity}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {products.length === 0 && (
                  <p className="py-8 text-center text-muted">
                    No products in the database yet.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
