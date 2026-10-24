import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { API, imgUrl, eur } from "../lib/api";
import { useCart } from "../context/CartContext";
import { Reveal } from "../components/Reveal";

function Spec({ title, children, testid }) {
  const [open, setOpen] = useState(false);
  if (!children) return null;
  return (
    <div className="border-b border-white/10">
      <button onClick={() => setOpen(!open)} data-testid={testid}
        className="w-full flex justify-between items-center py-4 font-display font-semibold uppercase tracking-[0.15em] text-sm">
        {title}<ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-5 text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{children}</div>}
    </div>
  );
}

export default function ProductDetail({ preview = false }) {
  const { slug } = useParams();
  const { addItem, wishlist, toggleWishlist } = useCart();
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);

  const { data: p, isLoading, isError } = useQuery({
    queryKey: ["product", slug, preview],
    queryFn: async () => (await API.get(preview ? `/admin/products-by-slug/${slug}` : `/products/${slug}`)).data,
    retry: false,
  });

  const colors = useMemo(() => {
    const map = {};
    (p?.variants || []).forEach((v) => { if (v.color && !map[v.color]) map[v.color] = v.color_hex; });
    return Object.entries(map);
  }, [p]);
  const activeColor = color ?? colors[0]?.[0] ?? null;
  const sizes = useMemo(() => {
    const seen = {};
    (p?.variants || []).filter((v) => !activeColor || v.color === activeColor)
      .forEach((v) => { if (v.size) seen[v.size] = (seen[v.size] || 0) + v.stock; });
    return Object.entries(seen);
  }, [p, activeColor]);
  const variant = (p?.variants || []).find((v) => v.color === activeColor && v.size === size)
    || (p?.variants || []).find((v) => v.size === size && !activeColor);
  const gallery = useMemo(() => {
    const imgs = [...(p?.images || [])];
    (p?.variants || []).forEach((v) => { if (v.image && !imgs.includes(v.image)) imgs.push(v.image); });
    return imgs;
  }, [p]);

  if (isLoading) return <div className="px-8 py-32 font-mono text-zinc-500" data-testid="product-loading">LOADING…</div>;
  if (isError || !p) return (
    <div className="px-8 py-32" data-testid="product-not-found">
      <p className="font-display text-3xl uppercase">Product not found</p>
      <Link to="/shop" className="btn-outline mt-6 inline-flex">BACK TO SHOP</Link>
    </div>
  );

  const wished = wishlist.includes(p.slug);
  const add = () => {
    if (p.variants.length && !variant) return toast.error("Select a size first");
    if (variant && variant.stock < 1) return toast.error("Out of stock");
    addItem(p, variant || { sku: `${p.id}-default`, size: "", color: "", stock: 99 }, 1);
    toast.success("Added to your bag");
  };

  return (
    <div className="px-4 sm:px-8 lg:px-16 py-10 lg:py-16 grid lg:grid-cols-2 gap-10 lg:gap-16" data-testid="product-detail">
      <div>
        <div className="aspect-[3/4] bg-coal overflow-hidden clip-frame" data-testid="product-gallery">
          {gallery[imgIdx]
            ? <img src={imgUrl(gallery[imgIdx])} alt={p.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center font-mono text-xs text-zinc-600">IMAGE FORTHCOMING</div>}
        </div>
        {gallery.length > 1 && (
          <div className="flex gap-2 mt-3">
            {gallery.map((g, i) => (
              <button key={i} onClick={() => setImgIdx(i)} data-testid={`gallery-thumb-${i}`}
                className={`w-16 h-20 overflow-hidden border ${i === imgIdx ? "border-brand" : "border-white/10"}`}>
                <img src={imgUrl(g)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Reveal>
        {preview && <p className="font-mono text-xs text-amber-400 mb-4" data-testid="preview-badge">DRAFT PREVIEW — NOT VISIBLE TO CUSTOMERS</p>}
        <p className="eyebrow mb-3">{p.collection || p.category || "PIMPS OUT"}</p>
        <h1 className="font-display font-black uppercase italic text-4xl sm:text-6xl leading-[0.95]" data-testid="product-name">{p.name}</h1>
        <p className="font-mono text-xl mt-4" data-testid="product-price">
          {p.sale_price ? <><s className="text-zinc-600 mr-3">{eur(p.price)}</s><span className="text-brand-soft">{eur(p.sale_price)}</span></> : eur(p.price)}
        </p>
        <p className="text-zinc-400 text-sm mt-5 leading-relaxed" data-testid="product-description">{p.description}</p>

        {colors.length > 0 && (
          <div className="mt-7">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">Colour — {activeColor}</p>
            <div className="flex gap-3">
              {colors.map(([name, hex]) => (
                <button key={name} onClick={() => { setColor(name); setSize(null); }} aria-label={name}
                  data-testid={`color-${name}`}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${activeColor === name ? "border-brand scale-110" : "border-white/20"}`}
                  style={{ backgroundColor: hex }} />
              ))}
            </div>
          </div>
        )}

        {sizes.length > 0 && (
          <div className="mt-7">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">Size</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map(([s, stock]) => (
                <button key={s} onClick={() => stock > 0 && setSize(s)} disabled={stock === 0}
                  data-testid={`size-${s}`}
                  className={`min-w-[48px] px-3 py-2.5 border font-mono text-sm transition-colors ${size === s ? "border-brand bg-brand/10 text-white" : stock === 0 ? "border-white/5 text-zinc-700 line-through" : "border-white/15 text-zinc-300 hover:border-white/50"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-9">
          <button onClick={add} className="btn-primary flex-1" disabled={p.total_stock === 0} data-testid="add-to-cart-button"
            style={p.total_stock === 0 ? { opacity: 0.4 } : {}}>
            <ShoppingBag size={16} /> {p.total_stock === 0 ? "SOLD OUT" : "ADD TO BAG"}
          </button>
          <button onClick={() => { toggleWishlist(p.slug); toast.success(wished ? "Removed from wishlist" : "Saved to wishlist"); }}
            aria-label="Wishlist" data-testid="wishlist-toggle"
            className={`p-4 border transition-colors ${wished ? "border-brand text-brand" : "border-white/20 text-zinc-300 hover:border-brand"}`}>
            <Heart size={18} fill={wished ? "currentColor" : "none"} />
          </button>
        </div>
        {variant && <p className="font-mono text-[10px] text-zinc-600 mt-3">SKU {variant.sku} — {variant.stock} IN STOCK</p>}

        <div className="mt-9">
          <Spec title="Material & Fabric" testid="spec-material">
            {[p.material, p.gsm ? `${p.gsm} GSM` : "", p.fit ? `Fit: ${p.fit}` : ""].filter(Boolean).join("\n")}
          </Spec>
          <Spec title="Care Instructions" testid="spec-care">{p.care}</Spec>
          <Spec title="Size Guide" testid="spec-size-guide">{p.size_guide}</Spec>
        </div>
      </Reveal>
    </div>
  );
}
