import { useEffect, useState } from "react";
import { AuthContext } from "./context";
import { apiJson } from "../lib/api";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    apiJson("/auth/me", { signal: controller.signal })
      .then((data) => setUser(data.user))
      .catch((err) => {
        if (err.name !== "AbortError" && err.status !== 401)
          setError("Could not check your session. Refresh to try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    const expire = () => setUser(null);
    window.addEventListener("session-expired", expire);
    return () => {
      controller.abort();
      window.removeEventListener("session-expired", expire);
    };
  }, []);
  async function login(email, password) {
    const data = await apiJson("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    setError("");
  }
  async function logout() {
    await apiJson("/auth/logout", { method: "POST" });
    setUser(null);
  }
  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, error, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
