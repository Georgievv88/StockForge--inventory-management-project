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
      cost: Number(form.cost),
      price: Number(form.price),
      quantity: Number(form.quantity),
      lowStockThreshold: Number(form.lowStockThreshold),
    };

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${product._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedProduct),
        },
      );

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
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500";

  return (
    <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-6">
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
              className="mb-2 block text-sm text-slate-300"
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
              "Other",
            ].map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
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
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-slate-700 px-6 py-3 hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProduct;
