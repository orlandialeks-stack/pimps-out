import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const CartContext = createContext(null);

const load = (key, fb) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => load("po_cart", []));
  const [wishlist, setWishlist] = useState(() => load("po_wishlist", []));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [discount, setDiscount] = useState(null);

  useEffect(() => { localStorage.setItem("po_cart", JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem("po_wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  const addItem = useCallback((product, variant, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.sku === variant.sku);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(next[i].qty + qty, variant.stock) };
        return next;
      }
      return [...prev, {
        product_id: product.id, slug: product.slug, sku: variant.sku,
        name: product.name, size: variant.size, color: variant.color,
        price: product.sale_price || product.price,
        image: variant.image || product.images?.[0] || "",
        stock: variant.stock, qty,
      }];
    });
    setDrawerOpen(true);
  }, []);

  const setQty = useCallback((sku, qty) => {
    setItems((prev) => qty <= 0 ? prev.filter((x) => x.sku !== sku)
      : prev.map((x) => (x.sku === sku ? { ...x, qty: Math.min(qty, x.stock) } : x)));
  }, []);

  const removeItem = useCallback((sku) => setItems((prev) => prev.filter((x) => x.sku !== sku)), []);
  const clearCart = useCallback(() => { setItems([]); setDiscount(null); }, []);

  const toggleWishlist = useCallback((slug) => {
    setWishlist((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  }, []);

  const subtotal = useMemo(() => items.reduce((s, x) => s + x.price * x.qty, 0), [items]);
  const count = useMemo(() => items.reduce((s, x) => s + x.qty, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, setQty, removeItem, clearCart, subtotal, count,
      drawerOpen, setDrawerOpen, wishlist, toggleWishlist, discount, setDiscount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
