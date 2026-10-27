import { apiFetch } from "../lib/api";
import { useState } from "react";

function EditProduct({ product, onProductUpdated, onCancel }) {
  const [form, setForm] = useState({
    name: product.name,
    sku: product.sku,
    category: product.category,
    cost: product.cost,
    price: product.price,
    quantity: product.quantity,
    lowStockThreshold: product.lowStockThreshold,
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const updatedProduct = {
      ...form,
      expectedVersion: product.__v || 0,
      cost: Number(form.cost),
      price: Number(form.price),
      quantity: Number(form.quantity),
      lowStockThreshold: Number(form.lowStockThreshold),
    };

    try {
      const response = await apiFetch(`/products/${product._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update product");
      }

      onProductUpdated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle =
    "w-full rounded-lg border border-line-strong bg-raised px-4 py-3 text-ink outline-none focus:border-accent";

  return (
    <div className="mt-6 rounded-xl border border-line-strong bg-surface p-6">
      <h2 className="mb-5 text-xl font-semibold">Edit Product</h2>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        {[
          { name: "name", label: "Product Name", type: "text" },
          { name: "sku", label: "SKU", type: "text" },
          { name: "cost", label: "Unit Cost (MKD)", type: "number" },
          { name: "price", label: "Selling Price (MKD)", type: "number" },
          { name: "quantity", label: "Quantity", type: "number" },
          {
            name: "lowStockThreshold",
            label: "Low Stock Threshold",
            type: "number",
          },
        ].map((field) => (
          <div key={field.name}>
            <label
              htmlFor={`edit-${field.name}`}
              className="mb-2 block text-sm text-muted"
            >
              {field.label}
            </label>

            <input
              id={`edit-${field.name}`}
              name={field.name}
              type={field.type}
              required
              min={field.type === "number" ? 0 : undefined}
              step={
                field.type === "number"
                  ? field.name === "cost" || field.name === "price"
                    ? "0.01"
                    : "1"
                  : undefined
              }
              value={form[field.name]}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>
        ))}

        <div className="sm:col-span-2">
          <label htmlFor="edit-category" className="mb-2 block text-sm">
            Category
          </label>

          <select
            id="edit-category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className={inputStyle}
          >
            {[
              "Graphics Cards",
              "Processors",
              "Memory",
              "Storage",
              "Motherboards",
              "Power Supplies",
              "Cases",
              "Cooling",
              "Peripherals",
              "Other",
            ].map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger sm:col-span-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand px-6 py-3 font-medium hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-line-strong px-6 py-3 hover:bg-raised disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProduct;
