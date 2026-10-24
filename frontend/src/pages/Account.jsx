import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { API, eur, fmtErr } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Reveal } from "../components/Reveal";

function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.email, form.password, form.name);
      toast.success(mode === "login" ? "Welcome back." : "Account created. Welcome to PIMPS OUT.");
    } catch (err) {
      toast.error(fmtErr(err));
    }
    setBusy(false);
  };

  return (
    <div className="max-w-md mx-auto" data-testid="auth-form">
      <div className="flex gap-2 mb-8">
        {["login", "register"].map((m) => (
          <button key={m} onClick={() => setMode(m)} data-testid={`auth-tab-${m}`}
            className={`flex-1 py-3 font-display font-bold uppercase tracking-[0.15em] text-sm border ${mode === m ? "border-brand text-brand-soft" : "border-white/10 text-zinc-500"}`}>
            {m === "login" ? "Sign In" : "Create Account"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === "register" && (
          <input className="input-dark" placeholder="Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="auth-name" />
        )}
        <input className="input-dark" placeholder="Email" type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="auth-email" />
        <input className="input-dark" placeholder="Password (min 8 chars)" type="password" required minLength={8} value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="auth-password" />
        <button disabled={busy} className="btn-primary disabled:opacity-50" data-testid="auth-submit">
          {busy ? "…" : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
        </button>
      </form>
    </div>
  );
}

const STATUS_COLOR = { confirmed: "text-emerald-400", awaiting_payment: "text-amber-400", shipped: "text-sky-400", delivered: "text-emerald-400", cancelled: "text-zinc-500", refunded: "text-brand-soft", processing: "text-amber-300" };

export default function Account() {
  const { user, logout } = useAuth();
  const { wishlist } = useCart();

  const { data: orders } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await API.get("/orders/my")).data,
    enabled: !!user,
  });
  const { data: wished } = useQuery({
    queryKey: ["wishlist", wishlist],
    queryFn: async () => {
      const res = await Promise.allSettled(wishlist.map((s) => API.get(`/products/${s}`)));
      return res.filter((r) => r.status === "fulfilled").map((r) => r.value.data);
    },
    enabled: !!user,
  });

  if (user === null) return <div className="px-8 py-32 font-mono text-zinc-500">LOADING…</div>;

  return (
    <div className="px-4 sm:px-8 lg:px-16 py-14" data-testid="account-page">
      {!user ? (
        <>
          <Reveal className="text-center mb-10">
            <p className="eyebrow mb-3">ACCOUNT</p>
            <h1 className="font-display font-black uppercase italic text-5xl sm:text-6xl">Your rules start here</h1>
          </Reveal>
          <AuthForm />
        </>
      ) : (
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-12">
            <div>
              <p className="eyebrow mb-2">ACCOUNT</p>
              <h1 className="font-display font-black uppercase italic text-4xl sm:text-5xl" data-testid="account-name">{user.name || user.email}</h1>
              <p className="font-mono text-xs text-zinc-500 mt-1">{user.email} — {user.role?.toUpperCase()}</p>
            </div>
            <div className="flex gap-3">
              {user.role === "admin" && <Link to="/admin" className="btn-outline" data-testid="admin-dashboard-link">ADMIN DASHBOARD</Link>}
              <button onClick={logout} className="btn-outline" data-testid="logout-button">SIGN OUT</button>
            </div>
          </div>

          <h2 className="font-display font-bold uppercase tracking-[0.15em] text-2xl mb-6">Order History</h2>
          {!orders?.length && <p className="text-zinc-500 text-sm mb-12" data-testid="no-orders">No orders yet. The first drop is coming.</p>}
          <div className="flex flex-col gap-4 mb-14">
            {(orders || []).map((o) => (
              <div key={o.id} className="card-dark p-5 flex flex-wrap justify-between gap-4" data-testid={`order-${o.id.slice(-6)}`}>
                <div>
                  <p className="font-mono text-xs text-zinc-500">#{o.id.slice(-8).toUpperCase()} — {new Date(o.created_at).toLocaleDateString()}</p>
                  <p className="font-display font-semibold uppercase mt-1">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono">{eur(o.total)}</p>
                  <p className={`font-mono text-xs uppercase ${STATUS_COLOR[o.status] || "text-zinc-400"}`} data-testid={`order-status-${o.id.slice(-6)}`}>
                    {o.status?.replace("_", " ")} {o.tracking_code ? `— ${o.tracking_code}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display font-bold uppercase tracking-[0.15em] text-2xl mb-6">Wishlist</h2>
          {!wished?.length && <p className="text-zinc-500 text-sm" data-testid="wishlist-empty">Nothing saved yet.</p>}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(wished || []).map((p) => (
              <Link key={p.id} to={`/shop/${p.slug}`} className="card-dark p-4 block hover:border-brand transition-colors" data-testid={`wishlist-${p.slug}`}>
                <p className="font-display font-semibold uppercase">{p.name}</p>
                <p className="font-mono text-sm text-zinc-400 mt-1">{eur(p.sale_price || p.price)}</p>
              </Link>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
