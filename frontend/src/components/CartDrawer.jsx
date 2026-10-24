import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { eur, imgUrl } from "../lib/api";

export default function CartDrawer() {
  const { items, drawerOpen, setDrawerOpen, setQty, removeItem, subtotal } = useCart();

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} data-testid="cart-overlay" />
          <motion.aside className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-coal border-l border-white/10 z-50 flex flex-col"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }} data-testid="cart-drawer">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="font-display font-bold uppercase tracking-[0.15em] text-xl">Your Bag</h2>
              <button onClick={() => setDrawerOpen(false)} data-testid="cart-close" aria-label="Close cart" className="text-zinc-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {items.length === 0 && (
                <p className="text-zinc-500 text-sm" data-testid="cart-empty">Your bag is empty. The collection drops soon.</p>
              )}
              {items.map((it) => (
                <div key={it.sku} className="flex gap-4 border border-white/10 p-3" data-testid={`cart-item-${it.sku}`}>
                  {it.image && <img src={imgUrl(it.image)} alt={it.name} className="w-16 h-20 object-cover" />}
                  <div className="flex-1">
                    <p className="font-display font-semibold uppercase tracking-wide">{it.name}</p>
                    <p className="font-mono text-xs text-zinc-500">{it.size} / {it.color}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => setQty(it.sku, it.qty - 1)} data-testid={`cart-minus-${it.sku}`} className="p-1 border border-white/15 hover:border-brand"><Minus size={12} /></button>
                      <span className="font-mono text-sm">{it.qty}</span>
                      <button onClick={() => setQty(it.sku, it.qty + 1)} data-testid={`cart-plus-${it.sku}`} className="p-1 border border-white/15 hover:border-brand"><Plus size={12} /></button>
                      <button onClick={() => removeItem(it.sku)} data-testid={`cart-remove-${it.sku}`} className="ml-auto text-zinc-500 hover:text-brand"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="font-mono text-sm">{eur(it.price * it.qty)}</p>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-white/10">
              <div className="flex justify-between mb-4">
                <span className="font-display uppercase tracking-[0.15em] text-zinc-400">Subtotal</span>
                <span className="font-mono" data-testid="cart-subtotal">{eur(subtotal)}</span>
              </div>
              <Link to="/checkout" onClick={() => setDrawerOpen(false)}
                className={`btn-primary w-full ${items.length === 0 ? "pointer-events-none opacity-40" : ""}`}
                data-testid="cart-checkout-button">
                CHECKOUT
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
