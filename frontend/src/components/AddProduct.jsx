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
      const response = await fetch("http://localhost:5000/api/products", {
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
    <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-6">
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
              className="mb-2 block text-sm text-slate-300"
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
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>
        ))}

        <div className="sm:col-span-2">
          <label
            htmlFor="category"
            className="mb-2 block text-sm text-slate-300"
          >
            Category
          </label>

          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
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
              "Other",
            ].map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400 sm:col-span-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Product"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-6 py-3 hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;
