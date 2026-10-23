import { useState } from "react";
import { Search } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { products } from "../data/products";
function Products() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const categories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLocaleLowerCase());

    const matchesCategory = category === "All" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (value) =>
    new Intl.NumberFormat("mk-MK", {
      style: "currency",
      currency: "MKD",
    }).format(value);
  return (
    <div className="min-h-screen bg-slate-950 text-white lg:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-5 md:p-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="mt-2 text-slate-400">
          View and manage your inventory products.
        </p>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex min-w-52 flex-1 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4">
              <Search size={20} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full py-3 outline-none"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Categories" : item}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-5 text-sm text-slate-400">
            Showing {filteredProducts.length} of {products.length} products
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-700 text-slate-400">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const status =
                    product.quantity === 0
                      ? "Out of Stock"
                      : product.quantity <= product.lowStockThreshold
                        ? "Low Stock"
                        : "In Stock";

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="p-4 font-medium">{product.name}</td>
                      <td className="p-4 text-slate-400">{product.sku}</td>
                      <td className="p-4">{product.category}</td>
                      <td className="p-4">{formatPrice(product.price)}</td>
                      <td className="p-4">{product.quantity}</td>
                      <td className="p-4">
                        <span
                          className={
                            status === "Out of Stock"
                              ? "text-red-400"
                              : status === "Low Stock"
                                ? "text-yellow-400"
                                : "text-green-400"
                          }
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <p className="py-10 text-center text-slate-400">
                No products found.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Products;
