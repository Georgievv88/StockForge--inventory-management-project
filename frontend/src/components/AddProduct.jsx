import { apiFetch } from "../lib/api";
import { useState } from "react";

const emptyForm = {
  name: "",
  sku: "",
  category: "Graphics Cards",
  cost: "",
  price: "",
  quantity: "",
  lowStockThreshold: "5",
};

function AddProduct({ onProductAdded, onCancel }) {
  const [form, setForm] = useState(emptyForm);
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

    const newProduct = {
      ...form,
      cost: Number(form.cost),
      price: Number(form.price),
      quantity: Number(form.quantity),
      lowStockThreshold: Number(form.lowStockThreshold),
    };
    try {
      const response = await apiFetch("/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create product");
      }

      onProductAdded(data);
      setForm({ ...emptyForm });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-line-strong bg-surface p-6">
      <h2 className="mb-5 text-xl font-semibold">Add New Product</h2>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        {[
          { name: "name", label: "Product Name", type: "text" },
          { name: "sku", label: "SKU", type: "text" },
          { name: "cost", label: "Unit Cost", type: "number" },
          { name: "price", label: "Selling Price", type: "number" },
          { name: "quantity", label: "Quantity", type: "number" },
          {
            name: "lowStockThreshold",
            label: "Low Stock Threshold",
            type: "number",
          },
        ].map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="mb-2 block text-sm text-muted"
            >
              {field.label}
            </label>

            <input
              id={field.name}
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
              className="w-full rounded-lg border border-line-strong bg-raised px-4 py-3 text-ink outline-none focus:border-accent"
            />
          </div>
        ))}

        <div className="sm:col-span-2">
          <label
            htmlFor="category"
            className="mb-2 block text-sm text-muted"
          >
            Category
          </label>

          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-lg border border-line-strong bg-raised px-4 py-3 text-ink"
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
              <option key={category}>{category}</option>
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
            {saving ? "Saving..." : "Save Product"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line-strong px-6 py-3 hover:bg-raised"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;
