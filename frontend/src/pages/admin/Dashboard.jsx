import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { API, eur } from "../../lib/api";

export default function Dashboard() {
  const { data: products } = useQuery({ queryKey: ["admin-products"], queryFn: async () => (await API.get("/admin/products")).data });
  const { data: orders } = useQuery({ queryKey: ["admin-orders"], queryFn: async () => (await API.get("/admin/orders")).data });
  const { data: leads } = useQuery({ queryKey: ["admin-leads"], queryFn: async () => (await API.get("/admin/leads")).data });

  const revenue = (orders || []).filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total, 0);
  const lowStock = (products || []).flatMap((p) => (p.variants || []).filter((v) => v.stock <= 2)
    .map((v) => ({ name: p.name, ...v })));

  const cards = [
    { label: "Products", value: products?.length ?? "…", sub: `${(products || []).filter((p) => p.status === "published").length} published`, testid: "metric-products" },
    { label: "Orders", value: orders?.length ?? "…", sub: `${(orders || []).filter((o) => o.payment_status === "paid").length} paid`, testid: "metric-orders" },
    { label: "Revenue", value: eur(revenue), sub: "paid orders", testid: "metric-revenue" },
    { label: "Leads", value: leads?.length ?? "…", sub: "pre-launch signups", testid: "metric-leads" },
  ];

  return (
    <div data-testid="admin-home">
      <h1 className="font-display font-black uppercase italic text-3xl sm:text-4xl mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="card-dark p-5" data-testid={c.testid}>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{c.label}</p>
            <p className="font-display font-black text-3xl mt-2">{c.value}</p>
            <p className="font-mono text-[10px] text-zinc-600 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>
      {products?.length === 0 && (
        <div className="card-dark p-8 border-brand/30" data-testid="empty-catalogue-hint">
          <p className="font-display font-bold uppercase text-xl">Your catalogue is empty</p>
          <p className="text-zinc-400 text-sm mt-2">Add your first product when your collection is ready. Until then the store shows its pre-launch state.</p>
          <Link to="/admin/products/new" className="btn-primary mt-6 inline-flex" data-testid="add-first-product">ADD FIRST PRODUCT</Link>
        </div>
      )}
      {lowStock.length > 0 && (
        <div className="mt-8">
          <p className="font-display font-bold uppercase tracking-wider text-lg mb-3">Low Stock</p>
          {lowStock.map((v, i) => (
            <p key={i} className="font-mono text-xs text-amber-400 py-1" data-testid={`low-stock-${i}`}>
              {v.name} — {v.size}/{v.color}: {v.stock} left
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
