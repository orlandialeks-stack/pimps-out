import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API, eur, imgUrl, fmtErr } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Reveal } from "../components/Reveal";

export default function Checkout() {
  const { items, subtotal, discount, setDiscount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: user?.email || "", name: user?.name || "", line1: "", city: "", postal_code: "", country: "" });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const total = Math.max(0, subtotal - (discount?.discount || 0));

  const applyCode = async () => {
    try {
      const { data } = await API.post("/orders/check-discount", { code, subtotal });
      setDiscount(data);
      toast.success(`Code ${data.code} applied`);
    } catch (e) {
      setDiscount(null);
      toast.error(fmtErr(e));
    }
  };

  const pay = async (e) => {
    e.preventDefault();
    if (!items.length) return;
    setBusy(true);
    try {
      const { data } = await API.post("/payments/checkout", {
        items: items.map((x) => ({ product_id: x.product_id, sku: x.sku, qty: x.qty })),
        customer: form,
        discount_code: discount?.code || null,
        origin_url: window.location.origin,
      });
      window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(fmtErr(err));
      setBusy(false);
    }
  };

  if (!items.length) return (
    <div className="px-8 py-32 text-center" data-testid="checkout-empty">
      <p className="font-display font-bold uppercase text-3xl">Your bag is empty</p>
      <Link to="/shop" className="btn-primary mt-8 inline-flex">BACK TO SHOP</Link>
    </div>
  );

  return (
    <div className="px-4 sm:px-8 lg:px-16 py-14 grid lg:grid-cols-5 gap-12" data-testid="checkout-page">
      <Reveal className="lg:col-span-3">
        <p className="eyebrow mb-3">SECURE CHECKOUT</p>
        <h1 className="font-display font-black uppercase italic text-4xl sm:text-6xl mb-10">Checkout</h1>
        <form onSubmit={pay} className="flex flex-col gap-4 max-w-xl">
          <input className="input-dark" placeholder="Email" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="checkout-email" />
          <input className="input-dark" placeholder="Full name" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="checkout-name" />
          <input className="input-dark" placeholder="Street address" value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })} data-testid="checkout-address" />
          <div className="grid grid-cols-2 gap-4">
            <input className="input-dark" placeholder="City" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="checkout-city" />
            <input className="input-dark" placeholder="Postal code" value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })} data-testid="checkout-postal" />
          </div>
          <input className="input-dark" placeholder="Country" value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })} data-testid="checkout-country" />
          <div className="flex gap-2">
            <input className="input-dark" placeholder="Discount code" value={code}
              onChange={(e) => setCode(e.target.value)} data-testid="checkout-discount-input" />
            <button type="button" onClick={applyCode} className="btn-outline !px-5 !py-3" data-testid="checkout-discount-apply">APPLY</button>
          </div>
          <button disabled={busy} className="btn-primary mt-4 disabled:opacity-50" data-testid="checkout-pay-button">
            {busy ? "REDIRECTING…" : `PAY ${eur(total)}`}
          </button>
          <p className="font-mono text-[10px] text-zinc-600">Payments secured by Stripe. Card details never touch our servers. TEST MODE — no real charges.</p>
        </form>
      </Reveal>
      <Reveal delay={0.1} className="lg:col-span-2">
        <div className="card-dark p-6">
          <p className="font-display font-bold uppercase tracking-[0.15em] mb-5">Order Summary</p>
          {items.map((it) => (
            <div key={it.sku} className="flex gap-3 mb-4 items-center" data-testid={`checkout-item-${it.sku}`}>
              {it.image && <img src={imgUrl(it.image)} alt="" className="w-12 h-14 object-cover" />}
              <div className="flex-1">
                <p className="font-display font-semibold uppercase text-sm">{it.name}</p>
                <p className="font-mono text-[10px] text-zinc-500">{it.size} / {it.color} × {it.qty}</p>
              </div>
              <p className="font-mono text-sm">{eur(it.price * it.qty)}</p>
            </div>
          ))}
          <div className="border-t border-white/10 pt-4 mt-2 flex flex-col gap-2 font-mono text-sm">
            <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>{eur(subtotal)}</span></div>
            {discount && <div className="flex justify-between text-brand-soft" data-testid="checkout-discount-row"><span>Code {discount.code}</span><span>-{eur(discount.discount)}</span></div>}
            <div className="flex justify-between text-white text-base"><span>Total</span><span data-testid="checkout-total">{eur(total)}</span></div>
          </div>
        </div>
        <button onClick={() => navigate("/shop")} className="mt-4 font-mono text-xs text-zinc-500 hover:text-brand-soft uppercase tracking-widest">← Continue shopping</button>
      </Reveal>
    </div>
  );
}
