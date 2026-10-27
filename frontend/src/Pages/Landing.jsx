import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Check,
  ShieldCheck,
  Package,
  Search,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/context";
const features = [
  {
    icon: Boxes,
    number: "01",
    title: "A place for every product.",
    text: "Keep SKUs, costs, prices, and stock levels together. Find what you need without digging through spreadsheets.",
  },
  {
    icon: ArrowLeftRight,
    number: "02",
    title: "Every movement, accounted for.",
    text: "Record deliveries, removals, and physical counts. See who changed your stock, when, and why.",
  },
  {
    icon: ChartNoAxesCombined,
    number: "03",
    title: "See what needs attention.",
    text: "Check inventory value, spot low stock, and export a report when it is time to plan your next order.",
  },
];
export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="landing min-h-screen bg-canvas text-ink">
      <Navbar />
      <main>
        <section className="landing-hero landing-container">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" /> YOUR INVENTORY. IN SYNC.
            </p>
            <h1>
              Less guesswork.
              <br />
              <span>More control.</span>
            </h1>
            <p className="hero-description">
              Know what is on the shelf, what is running low, and what changed.
              One calm workspace for your products and the people who keep them
              moving.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="primary hero-cta"
              >
                {user ? "Open your workspace" : "Sign in to your workspace"}
                <ArrowUpRight size={18} />
              </Link>
              <a href="#features" className="secondary hero-cta">
                Take a look <ArrowRight size={18} />
              </a>
            </div>
            <p className="hero-footnote">
              <ShieldCheck size={16} /> Built for teamwork. Access stays in your
              hands.
            </p>
          </div>
          <div className="preview-wrap">
            <div
              className="inventory-preview"
              aria-label="Illustrative inventory preview with sample data"
            >
              <div className="preview-topbar">
                <span className="flex items-center gap-2 font-semibold">
                  <Boxes size={20} /> Stockify
                </span>
                <span className="preview-pill">WORKSPACE PREVIEW</span>
              </div>
              <div className="preview-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="preview-eyebrow">A CLEARER PICTURE</p>
                    <h2>Your inventory, at a glance.</h2>
                  </div>
                  <span className="preview-icon">
                    <Package size={21} />
                  </span>
                </div>
                <div className="preview-stats">
                  <div>
                    <span>Products</span>
                    <strong>
                      24
                      <span className="stat-dot" />
                    </strong>
                    <small>Across 6 categories</small>
                  </div>
                  <div>
                    <span>Units on hand</span>
                    <strong>186</strong>
                    <small>Ready for what is next</small>
                  </div>
                  <div>
                    <span>Need attention</span>
                    <strong className="preview-warning">02</strong>
                    <small>Below stock threshold</small>
                  </div>
                </div>
                <div className="preview-search">
                  <Search size={15} />
                  <span>Find a product or SKU</span>
                </div>
                <div className="preview-table">
                  <div className="preview-row preview-table-head">
                    <span>PRODUCT</span>
                    <span>ON HAND</span>
                    <span>STATUS</span>
                  </div>
                  {[
                    ["Graphics card", "GPU-001", "8", "In stock"],
                    ["DDR5 memory", "RAM-001", "24", "In stock"],
                    ["Solid-state drive", "SSD-001", "3", "Low stock"],
                  ].map(([name, sku, qty, status]) => (
                    <div className="preview-row" key={sku}>
                      <div className="flex items-center gap-3">
                        <span className="product-glyph">
                          <Package size={17} />
                        </span>
                        <span>
                          {name}
                          <small>{sku}</small>
                        </span>
                      </div>
                      <span>{qty}</span>
                      <span
                        className={
                          status === "Low stock"
                            ? "preview-badge warning"
                            : "preview-badge"
                        }
                      >
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="preview-footer"></div>
              </div>
            </div>
            <div className="preview-note">
              <span className="note-check">
                <Check size={18} />
              </span>
              <div>
                <strong>Nothing gets lost in the shuffle.</strong>
                <span>Every stock change leaves a trail.</span>
              </div>
            </div>
          </div>
        </section>
        <div className="landing-container">
          <div className="capability-strip">
            <span>LESS BUSYWORK. MORE CLARITY.</span>
            <span>
              <Check size={16} /> Product management
            </span>
            <span>
              <Check size={16} /> Stock history
            </span>
            <span>
              <Check size={16} /> Reports that travel
            </span>
          </div>
        </div>
        <section id="features" className="landing-container feature-section">
          <div className="section-intro">
            <p className="eyebrow">BUILT AROUND YOUR DAY</p>
            <h2>
              Everything connected.
              <br />
              Nothing overcomplicated.
            </h2>
            <p>
              From the first delivery to the next stock check, keep the whole
              team working from the same picture.
            </p>
          </div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, number, title, text }) => (
              <article className="feature-card" key={number}>
                <div className="flex items-center justify-between">
                  <span className="feature-icon">
                    <Icon size={24} />
                  </span>
                  <span className="feature-number">{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-container">
          <div className="workflow-section">
            <div>
              <p className="eyebrow">A WORKSPACE THAT WORKS TOGETHER</p>
              <h2>
                Give your team clarity.
                <br />
                Keep control of access.
              </h2>
              <p>
                Staff can add products and keep quantities up to date.
                Administrators manage access and invitations. Everyone knows
                where they stand.
              </p>
              <Link
                to={user ? "/settings" : "/register"}
                className="workflow-link"
              >
                {user
                  ? "Manage your workspace"
                  : "Already invited? Join your team"}
                <ArrowRight size={18} />
              </Link>
            </div>
            <ol className="workflow-steps">
              {[
                [
                  "Bring your products together",
                  "Add the details once. Keep one reliable inventory.",
                ],
                [
                  "Keep stock moving",
                  "Receive, remove, or count units with a clear record.",
                ],
                [
                  "Make the next move",
                  "Review low stock and take your reports with you.",
                ],
              ].map(([title, text], i) => (
                <li key={title}>
                  <span>{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="landing-container closing-section">
          <p className="eyebrow">A LITTLE MORE ORGANIZED. EVERY DAY.</p>
          <h2>
            Your next stock check
            <br />
            starts here.
          </h2>
          <Link
            to={user ? "/dashboard" : "/login"}
            className="primary hero-cta"
          >
            {user ? "Go to dashboard" : "Open Stockify"}
            <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="landing-container landing-footer">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <Boxes size={20} /> Stockify
        </Link>
        <p>Inventory in order. Team in sync.</p>
        <a href="#features">
          Explore the workspace <ArrowUpRight size={14} />
        </a>
      </footer>
    </div>
  );
}
