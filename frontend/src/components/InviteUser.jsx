import { useState } from "react";
import { apiJson } from "../lib/api";

export default function InviteUser({ onCreated }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState(null);
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setInvitation(null);
    try {
      setInvitation(
        await apiJson("/auth/invitations", {
          method: "POST",
          body: JSON.stringify({ email, role }),
        }),
      );
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="mt-8 rounded-xl border border-line bg-surface p-6">
      <h2 className="text-xl font-semibold">Invite a teammate</h2>
      <p className="mt-2 text-sm text-muted">
        Staff can view, add, and edit products, including stock quantities.
        Administrators can also delete products and invite teammates.
      </p>
      <form
        onSubmit={submit}
        className="invite-form mt-4 flex flex-wrap items-end gap-4"
      >
        <label className="flex flex-1 flex-col gap-2">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg bg-raised p-3"
          />
        </label>
        <label className="flex flex-col gap-2">
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg bg-raised p-3"
          >
            <option value="staff">Staff</option>
            <option value="admin">Administrator</option>
          </select>
        </label>
        <button
          disabled={saving}
          className="rounded-lg bg-brand px-5 py-3 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create invitation"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-4 text-danger">
          {error}
        </p>
      )}
      {invitation && (
        <div role="status" className="mt-4">
          <p>
            Share this link with {invitation.email}. It expires{" "}
            {new Date(invitation.expiresAt).toLocaleString()} and can be used
            once.
          </p>
          <label className="mt-2 block">
            Invitation link
            <input
              readOnly
              value={invitation.invitationUrl}
              onFocus={(e) => e.target.select()}
              className="mt-2 w-full rounded-lg bg-raised p-3"
            />
          </label>
        </div>
      )}
    </section>
  );
}
