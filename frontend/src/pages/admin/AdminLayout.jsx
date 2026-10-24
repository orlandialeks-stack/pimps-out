import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Ticket, FileText, Users, LogOut, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { fmtErr } from "../../lib/api";

const nav = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/discounts", label: "Discounts", icon: Ticket },
  { to: "/admin/content", label: "Site Content", icon: FileText },
  { to: "/admin/leads", label: "Leads & Messages", icon: Users },
];

function AdminLogin() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      if (u.role !== "admin") toast.error("This account is not an administrator");
    } catch (err) { toast.error(fmtErr(err)); }
    setBusy(false);
  };
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm card-dark p-8 flex flex-col gap-4" data-testid="admin-login-form">
        <img src="/assets/logo-transparent.png" alt="PIMPS OUT" className="h-10 w-auto mx-auto mb-2" />
        <p className="font-mono text-xs text-center text-zinc-500 tracking-[0.3em]">ADMIN ACCESS ONLY</p>
        <input className="input-dark" type="email" placeholder="Admin email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="admin-login-email" />
        <input className="input-dark" type="password" placeholder="Password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="admin-login-password" />
        <button disabled={busy} className="btn-primary disabled:opacity-50" data-testid="admin-login-submit">
          {busy ? "…" : "ENTER DASHBOARD"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  if (user === null) return <div className="px-8 py-32 font-mono text-zinc-500">LOADING…</div>;
  if (!user || user.role !== "admin") return <AdminLogin />;

  return (
    <div className="flex min-h-screen" data-testid="admin-dashboard">
      <aside className="w-56 shrink-0 border-r border-white/10 bg-coal hidden md:flex flex-col">
        <div className="p-5 border-b border-white/10">
          <img src="/assets/logo-transparent.png" alt="PIMPS OUT" className="h-8 w-auto" />
          <p className="font-mono text-[9px] text-zinc-600 tracking-[0.3em] mt-2">COMMAND CENTRE</p>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={`admin-nav-${n.label.toLowerCase().replace(/[^a-z]/g, "-")}`}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 font-display font-semibold uppercase tracking-wider text-sm transition-colors ${isActive ? "bg-brand/10 text-brand-soft border-l-2 border-brand" : "text-zinc-400 hover:text-white"}`}>
              <n.icon size={16} /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 flex flex-col gap-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-white text-sm font-display uppercase tracking-wider" data-testid="admin-view-site">
            <ExternalLink size={14} /> View Site
          </Link>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-brand-soft text-sm font-display uppercase tracking-wider" data-testid="admin-logout">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="md:hidden flex gap-2 overflow-x-auto p-3 border-b border-white/10 bg-coal">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `px-3 py-2 text-xs font-mono uppercase whitespace-nowrap ${isActive ? "text-brand-soft" : "text-zinc-500"}`}>
              {n.label}
            </NavLink>
          ))}
        </div>
        <main className="p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
