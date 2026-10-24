import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API, eur, fmtErr } from "../../lib/api";

const STATUSES = ["awaiting_payment", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function Orders() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(null);
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await API.get("/admin/orders")).data,
  });

  const update = async (id, changes) => {
    try {
      await API.put(`/admin/orders/${id}`, changes);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order updated");
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const refund = async (id) => {
    if (!window.confirm("Refund this order via Stripe? This cannot be undone.")) return;
    try {
      await API.post(`/admin/orders/${id}/refund`);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Refund issued");
    } catch (e) { toast.error(fmtErr(e)); }
  };

  return (
    <div data-testid="admin-orders">
      <h1 className="font-display font-black uppercase italic text-3xl sm:text-4xl mb-8">Orders</h1>
      {isLoading && <p className="font-mono text-zinc-500">LOADING…</p>}
      {orders?.length === 0 && <div className="card-dark p-8 text-zinc-400 text-sm" data-testid="orders-empty">No orders yet.</div>}
      <div className="flex flex-col gap-3">
        {(orders || []).map((o) => (
          <div key={o.id} className="card-dark p-4" data-testid={`admin-order-${o.id.slice(-6)}`}>
            <div className="flex flex-wrap items-center gap-4 cursor-pointer" onClick={() => setOpen(open === o.id ? null : o.id)}>
              <div className="flex-1 min-w-[180px]">
                <p className="font-mono text-xs text-zinc-500">#{o.id.slice(-8).toUpperCase()} — {new Date(o.created_at).toLocaleString()}</p>
                <p className="font-display font-semibold uppercase">{o.customer?.email}</p>
              </div>
              <p className="font-mono text-sm">{eur(o.total)}</p>
              <span className={`font-mono text-[10px] px-2 py-1 border ${o.payment_status === "paid" ? "border-emerald-500 text-emerald-400" : "border-amber-500 text-amber-400"}`} data-testid={`order-payment-${o.id.slice(-6)}`}>
                {o.payment_status?.toUpperCase()}
              </span>
              <select value={o.status} onClick={(e) => e.stopPropagation()}
                onChange={(e) => update(o.id, { status: e.target.value })} data-testid={`order-status-select-${o.id.slice(-6)}`}
                className="bg-steel border border-white/10 text-xs font-mono px-2 py-1.5 uppercase">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                {o.status === "refunded" && <option value="refunded">refunded</option>}
              </select>
            </div>
            {open === o.id && (
              <div className="mt-4 pt-4 border-t border-white/10 grid sm:grid-cols-2 gap-6" data-testid={`order-details-${o.id.slice(-6)}`}>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Items</p>
                  {o.items.map((it, i) => (
                    <p key={i} className="text-sm text-zinc-300">{it.name} — {it.size}/{it.color} × {it.qty} <span className="font-mono text-zinc-500">({eur(it.unit_price)})</span></p>
                  ))}
                  {o.discount_code && <p className="font-mono text-xs text-brand-soft mt-2">Code {o.discount_code} — -{eur(o.discount_amount)}</p>}
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-zinc-400">{o.customer?.name} — {[o.customer?.line1, o.customer?.city, o.customer?.postal_code, o.customer?.country].filter(Boolean).join(", ") || "no address"}</p>
                  <input className="input-dark !py-2" placeholder="Tracking code" defaultValue={o.tracking_code || ""}
                    onBlur={(e) => e.target.value !== (o.tracking_code || "") && update(o.id, { tracking_code: e.target.value })}
                    data-testid={`order-tracking-${o.id.slice(-6)}`} />
                  {o.payment_status === "paid" && (
                    <button onClick={() => refund(o.id)} className="btn-outline !py-2 text-xs self-start" data-testid={`order-refund-${o.id.slice(-6)}`}>ISSUE REFUND</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
