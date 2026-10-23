import { Package, Boxes, AlertTriangle, DollarSign } from "lucide-react";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/StatCard";
import { products } from "../data/products";

function Dashboard() {
  const totalProducts = products.length;
  const totalUnits = products.reduce(
    (total, product) => total + product.quantity,
    0,
  );

  const lowStockProducts = products.filter(
    (product) =>
      product.quantity > 0 && product.quantity <= product.lowStockThreshold,
  );

  const inventoryValue = products.reduce(
    (total, product) => total + product.cost * product.quantity,
    0,
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("mk-MK", {
      style: "currency",
      currency: "MKD",
    }).format(value);

  const getStockStatus = (product) => {
    if (product.quantity === 0) {
      return {
        label: "Out of Stock",
        style: "bg-red-500/10 text-red-400",
      };
    }
    if (product.quantity <= product.lowStockThreshold) {
      return {
        label: "Low Stock",
        style: "bg-yellow-500/10 text-yellow-400",
      };
    }
    return {
      label: "In Stock",
      style: "bg-green-500/10 text-green-400",
    };
  };
  return (
    <div className="min-h-screen bg-slate-950 text-white lg:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-5 md:p-8">
        <DashboardHeader />

        <div className="mt-8">
          <h2 className="text-xl font-semibold">Inventory Overview</h2>

          <p className="mt-1 text-sm text-slate-400">
            Track your stock and inventory performance.
          </p>
        </div>

        {/* Statistika*/}
        <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Products"
            value={totalProducts}
            icon={Package}
            description="Unique products in inventory"
          />

          <StatCard
            title="Total Units"
            value={totalUnits}
            icon={Boxes}
            description="Total available stock units"
          />

          <StatCard
            title="Low Stock"
            value={lowStockProducts.length}
            icon={AlertTriangle}
            description="Products requiring restocking"
          />

          <StatCard
            title="Inventory Value"
            value={formatCurrency(inventoryValue)}
            icon={DollarSign}
            description="Based on inventory unit cost"
          />
        </section>

        {/* Inventar */}
        <section className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-lg font-semibold">Inventory Overview</h2>
            <p className="mt-1 text-sm text-slate-400">
              Current inventory and stock availability
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const status = getStockStatus(product);

                  return (
                    <tr
                      key={product.id}
                      className="border-t border-slate-800 hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4 font-medium">{product.name}</td>

                      <td className="px-6 py-4 text-slate-400">
                        {product.sku}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {product.category}
                      </td>

                      <td className="px-6 py-4">{product.quantity}</td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
