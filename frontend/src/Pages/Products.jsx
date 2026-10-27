import { apiFetch } from "../lib/api";
import { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import AddProduct from "../components/AddProduct";
import EditProduct from "../components/EditProduct";

import { useAuth } from "../auth/context";

function Products() {
  const { user } = useAuth();
  const canManage = ["admin", "staff"].includes(user.role);
  const canDelete = user.role === "admin";
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        const response = await apiFetch("/products", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch products");
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

  function handleProductAdded(newProduct) {
    setProducts((previousProducts) => [...previousProducts, newProduct]);

    setShowAddForm(false);
    setError("");
  }

  function handleProductUpdated(updatedProduct) {
    setProducts((previousProducts) =>
      previousProducts.map((product) =>
        product._id === updatedProduct._id ? updatedProduct : product,
      ),
    );

    setEditingProduct(null);
    setError("");
  }

  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`,
    );

    if (!confirmed) return;

    setDeletingId(product._id);
    setError("");

    try {
      const response = await apiFetch(`/products/${product._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete product");
      }

      setProducts((previousProducts) =>
        previousProducts.filter((item) => item._id !== product._id),
      );

      if (editingProduct?._id === product._id) {
        setEditingProduct(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const categories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  const formatPrice = (value) =>
    new Intl.NumberFormat("mk-MK", {
      style: "currency",
      currency: "MKD",
    }).format(value);

  function getStockStatus(product) {
    if (product.quantity === 0) {
      return {
        label: "Out of Stock",
        style: "text-danger",
      };
    }

    if (product.quantity <= product.lowStockThreshold) {
      return {
        label: "Low Stock",
        style: "text-warning",
      };
    }

    return {
      label: "In Stock",
      style: "text-success",
    };
  }

  return (
    <div className="min-h-screen bg-canvas text-ink lg:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>

            <p className="mt-2 text-muted">
              View and manage your inventory products.
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setShowAddForm(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-brand px-5 py-3 font-medium hover:bg-brand-hover"
            >
              <Plus size={20} />
              Add Product
            </button>
          )}
        </div>

        {showAddForm && (
          <AddProduct
            onProductAdded={handleProductAdded}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {editingProduct && (
          <EditProduct
            key={editingProduct._id}
            product={editingProduct}
            onProductUpdated={handleProductUpdated}
            onCancel={() => setEditingProduct(null)}
          />
        )}

        <div className="mt-8 rounded-xl border border-line bg-surface p-4 sm:p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex min-w-0 w-full sm:min-w-52 flex-1 items-center gap-2 rounded-lg border border-line-strong bg-raised px-4">
              <Search size={20} className="text-muted" />

              <input
                type="text"
                placeholder="Search products or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 w-full py-3 outline-none"
              />
            </div>

            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full sm:w-auto min-w-0 rounded-lg border border-line-strong bg-raised px-4 py-3"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Categories" : item}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" className="mt-5 text-sm text-danger">
              Error: {error}
            </p>
          )}

          {loading ? (
            <p className="mt-5 text-accent">Loading products...</p>
          ) : (
            <p className="mt-5 text-sm text-muted">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="mobile-cards w-full text-left text-sm">
              <thead className="border-b border-line-strong text-muted">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Status</th>
                  {canManage && <th className="p-4">Actions</th>}
                </tr>
              </thead>

              <tbody>
                {!loading &&
                  filteredProducts.map((product) => {
                    const status = getStockStatus(product);

                    return (
                      <tr
                        key={product._id}
                        className="border-b border-line hover:bg-raised/50"
                      >
                        <td data-label="Product" className="p-4 font-medium">
                          {product.name}
                        </td>

                        <td data-label="SKU" className="p-4 text-muted">
                          {product.sku}
                        </td>

                        <td data-label="Category" className="p-4">
                          {product.category}
                        </td>

                        <td data-label="Price" className="p-4">
                          {formatPrice(product.price)}
                        </td>

                        <td data-label="Quantity" className="p-4">
                          {product.quantity}
                        </td>

                        <td data-label="Status" className="p-4">
                          <span className={status.style}>{status.label}</span>
                        </td>

                        {canManage && (
                          <td data-label="Actions" className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddForm(false);
                                  setEditingProduct(product);
                                }}
                                disabled={deletingId === product._id}
                                className="flex items-center gap-2 rounded-lg border border-line-strong px-3 py-2 text-accent hover:bg-raised disabled:opacity-50"
                              >
                                <Pencil size={16} />
                                Edit
                              </button>

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(product)}
                                  disabled={deletingId !== null}
                                  className="flex items-center gap-2 rounded-lg border border-danger/30 px-3 py-2 text-danger hover:bg-danger/10 disabled:opacity-50"
                                >
                                  <Trash2 size={16} />
                                  {deletingId === product._id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {!loading && !error && filteredProducts.length === 0 && (
              <p className="py-10 text-center text-muted">
                {products.length === 0
                  ? "No products in the database yet."
                  : "No matching products found."}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Products;
