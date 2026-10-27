import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme/context";
export default function Appearance() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <section
      className="panel mt-8 flex flex-wrap items-center justify-between gap-6"
      aria-labelledby="appearance-title"
    >
      <div className="flex items-center gap-4">
        <span className="appearance-icon">
          {dark ? <Moon size={24} /> : <Sun size={24} />}
        </span>
        <div>
          <h2 id="appearance-title" className="text-xl font-semibold">
            Appearance
          </h2>
          <p id="theme-description" className="mt-1 text-sm text-muted">
            Choose your workspace lighting. Saved in this browser.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          Night mode {dark ? "on" : "off"}
        </span>
        <button
          type="button"
          role="switch"
          aria-label="Night mode"
          aria-checked={dark}
          aria-describedby="theme-description"
          onClick={() => setTheme(dark ? "light" : "dark")}
          className="theme-switch"
        >
          <span className="theme-switch-thumb">
            {dark ? <Moon size={14} /> : <Sun size={14} />}
          </span>
        </button>
      </div>
    </section>
  );
}
