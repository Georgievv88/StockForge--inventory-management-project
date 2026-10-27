import { useEffect, useState } from "react";
import { ThemeContext } from "./context";
function initialTheme() {
  try {
    return localStorage.getItem("stockforge-theme") === "light"
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}
export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("stockforge-theme", theme);
    } catch {
      /* Theme works without storage. */
    }
  }, [theme]);
  useEffect(() => {
    const sync = (event) => {
      if (event.key === "stockforge-theme")
        setTheme(event.newValue === "light" ? "light" : "dark");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
