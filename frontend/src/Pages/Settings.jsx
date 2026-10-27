import Appearance from "../components/Appearance";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import InviteUser from "../components/InviteUser";
import { useAuth } from "../auth/context";
import { apiJson } from "../lib/api";
import { dateTime } from "../lib/format";

export default function Settings() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user.name);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  async function saveProfile(e) {
    e.preventDefault();
    setBusy("profile");
    setError("");
    setNotice("");
    try {
      const result = await apiJson("/settings/profile", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      setUser(result.user);
      setNotice("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }
  async function changePassword(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (passwords.password !== passwords.confirm) {
      setError("New passwords do not match");
      return;
    }
    setBusy("password");
    try {
      await apiJson("/settings/password", {
        method: "POST",
        body: JSON.stringify(passwords),
      });
      setUser(null);
      navigate("/login", { replace: true, state: { passwordChanged: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <PageShell
      title="Settings"
      description="Manage your profile, account security, and workspace access."
    >
      {error && (
        <p role="alert" className="mt-5 text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-5 text-success">
          {notice}
        </p>
      )}
      <Appearance />
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <form className="panel space-y-4" onSubmit={saveProfile}>
          <h2 className="text-xl font-semibold">Your profile</h2>
          <label>
            Full name
            <input
              required
              maxLength={160}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <p className="text-muted">
            {user.email} · {user.role === "admin" ? "Administrator" : "Staff"}
          </p>
          <p className="text-sm text-subtle">
            Your sign-in email is set by your invitation.
          </p>
          <button className="primary" disabled={!!busy}>
            {busy === "profile" ? "Saving..." : "Save profile"}
          </button>
        </form>
        <form className="panel space-y-4" onSubmit={changePassword}>
          <h2 className="text-xl font-semibold">Change password</h2>
          {[
            ["currentPassword", "Current password"],
            ["password", "New password"],
            ["confirm", "Confirm new password"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                required
                type="password"
                autoComplete={
                  key === "currentPassword"
                    ? "current-password"
                    : "new-password"
                }
                minLength={key === "currentPassword" ? undefined : 12}
                value={passwords[key]}
                onChange={(e) =>
                  setPasswords({ ...passwords, [key]: e.target.value })
                }
              />
            </label>
          ))}
          <p className="text-sm text-muted">
            Use at least 12 characters. Changing your password signs you out on
            all devices.
          </p>
          <button className="primary" disabled={!!busy}>
            {busy === "password" ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
      {user.role === "admin" && <Team />}
    </PageShell>
  );
}
function Team() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiJson("/settings/users", { signal: controller.signal }),
      apiJson("/settings/invitations", { signal: controller.signal }),
    ])
      .then(([people, pending]) => {
        setUsers(people);
        setInvitations(pending);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  function refresh() {
    setLoading(true);
    setError("");
    setRevision((v) => v + 1);
  }
  async function changeAccess(person, changes) {
    if (
      !window.confirm(
        `Update access for ${person.name}? Their current sessions will end.`,
      )
    )
      return;
    setBusy(person._id);
    setError("");
    setNotice("");
    try {
      await apiJson(`/settings/users/${person._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          role: person.role,
          isActive: person.isActive !== false,
          ...changes,
        }),
      });
      setNotice("Access updated.");
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }
  async function revoke(invitation) {
    if (!window.confirm(`Revoke the invitation for ${invitation.email}?`))
      return;
    setBusy(invitation._id);
    setError("");
    try {
      await apiJson(`/settings/invitations/${invitation._id}`, {
        method: "DELETE",
      });
      setNotice("Invitation revoked.");
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <InviteUser onCreated={refresh} />
      <section className="panel mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Team access</h2>
          <button className="secondary" disabled={loading} onClick={refresh}>
            Refresh team
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-danger">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-4 text-success">
            {notice}
          </p>
        )}
        {loading ? (
          <p className="mt-4">Loading team...</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((p) => (
                    <tr key={p._id}>
                      <td>
                        {p.name}
                        {p._id === user.id && " (you)"}
                      </td>
                      <td>{p.email}</td>
                      <td>{p.role}</td>
                      <td>{p.isActive === false ? "Inactive" : "Active"}</td>
                      <td>
                        {p._id !== user.id && (
                          <div className="flex gap-2">
                            <button
                              className="secondary"
                              disabled={!!busy}
                              onClick={() =>
                                changeAccess(p, {
                                  role: p.role === "admin" ? "staff" : "admin",
                                })
                              }
                            >
                              {p.role === "admin" ? "Make staff" : "Make admin"}
                            </button>
                            <button
                              className="secondary"
                              disabled={!!busy}
                              onClick={() =>
                                changeAccess(p, {
                                  isActive: p.isActive === false,
                                })
                              }
                            >
                              {p.isActive === false ? "Activate" : "Deactivate"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="mt-8 font-semibold">Pending invitations</h3>
            {!invitations.length && (
              <p className="mt-3 text-muted">No pending invitations.</p>
            )}
            <ul className="mt-3 divide-y divide-line">
              {invitations.map((i) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                  key={i._id}
                >
                  <span>
                    {i.email} · {i.role}
                    <small className="block text-muted">
                      Expires {dateTime(i.expiresAt)}
                    </small>
                  </span>
                  <button
                    className="secondary"
                    disabled={!!busy}
                    onClick={() => revoke(i)}
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
