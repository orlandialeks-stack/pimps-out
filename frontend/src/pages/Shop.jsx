import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { API, imgUrl, eur } from "../lib/api";
import { Reveal } from "../components/Reveal";

export default function Shop() {
  const { content } = useOutletContext();
  const [category, setCategory] = useState("");
  const [collection, setCollection] = useState("");
  const [email, setEmail] = useState("");

  const { data: products } = useQuery({
    queryKey: ["products", category, collection],
    queryFn: async () => (await API.get(`/products?category=${category}&collection=${collection}`)).data,
  });
  const { data: taxonomies } = useQuery({
    queryKey: ["taxonomies"],
    queryFn: async () => (await API.get("/taxonomies")).data,
  });
  const cats = Array.isArray(taxonomies) ? taxonomies.filter((t) => t.type === "category") : [];
  const colls = Array.isArray(taxonomies) ? taxonomies.filter((t) => t.type === "collection") : [];

  const notify = async (e) => {
    e.preventDefault();
    try {
      await API.post("/leads", { email, source: "prelaunch" });
      toast.success("You're first in line.");
      setEmail("");
    } catch { toast.error("Could not save your email"); }
  };

  return (
    <div className="px-4 sm:px-8 lg:px-16 py-14" data-testid="shop-page">
      <Reveal>
        <p className="eyebrow mb-3">CATALOGUE</p>
        <h1 className="font-display font-black uppercase italic text-5xl sm:text-7xl">Shop</h1>
      </Reveal>

      {(cats.length > 0 || colls.length > 0) && (
        <div className="flex flex-wrap gap-2 mt-8" data-testid="shop-filters">
          <button onClick={() => { setCategory(""); setCollection(""); }} data-testid="filter-all"
            className={`font-mono text-xs uppercase tracking-widest px-4 py-2 border ${!category && !collection ? "border-brand text-brand-soft" : "border-white/15 text-zinc-400 hover:border-white/40"}`}>ALL</button>
          {cats.map((c) => (
            <button key={c.id} onClick={() => { setCategory(c.name); setCollection(""); }} data-testid={`filter-cat-${c.name}`}
              className={`font-mono text-xs uppercase tracking-widest px-4 py-2 border ${category === c.name ? "border-brand text-brand-soft" : "border-white/15 text-zinc-400 hover:border-white/40"}`}>{c.name}</button>
          ))}
          {colls.map((c) => (
            <button key={c.id} onClick={() => { setCollection(c.name); setCategory(""); }} data-testid={`filter-coll-${c.name}`}
              className={`font-mono text-xs uppercase tracking-widest px-4 py-2 border ${collection === c.name ? "border-brand text-brand-soft" : "border-white/15 text-zinc-400 hover:border-white/40"}`}>{c.name}</button>
          ))}
        </div>
      )}

      {Array.isArray(products) && products.length === 0 && (
        <div className="mt-16 max-w-2xl" data-testid="shop-empty-state">
          <div className="card-dark p-8 sm:p-12">
            <p className="font-mono text-xs text-brand-soft tracking-[0.3em] mb-4">PRE-LAUNCH</p>
            <h2 className="font-display font-black uppercase italic text-3xl sm:text-5xl leading-[0.95]">
              The collection is being crafted.
            </h2>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base">
              {content?.coming_soon?.message || "Collection 001 drops soon. Leave your email and get early access before anyone else."}
            </p>
            <form onSubmit={notify} className="flex flex-col sm:flex-row gap-3 mt-8">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                placeholder="your@email.com" className="input-dark flex-1" data-testid="shop-notify-input" />
              <button className="btn-primary" data-testid="shop-notify-submit">GET EARLY ACCESS</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12">
        {(Array.isArray(products) ? products : []).map((p, i) => (
          <Reveal key={p.id} delay={Math.min(i * 0.05, 0.4)}>
            <Link to={`/shop/${p.slug}`} className="group block" data-testid={`product-card-${p.slug}`}>
              <div className="aspect-[3/4] overflow-hidden bg-coal relative clip-frame">
                {p.images?.[0]
                  ? <img src={imgUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center font-mono text-xs text-zinc-600">NO IMAGE</div>}
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {p.total_stock === 0 && <span className="absolute top-3 left-3 bg-steel font-mono text-[10px] px-2 py-1" data-testid={`soldout-${p.slug}`}>SOLD OUT</span>}
                {p.sale_price ? <span className="absolute top-3 right-3 bg-brand font-mono text-[10px] px-2 py-1 text-white">SALE</span> : null}
              </div>
              <div className="mt-3">
                <div className="flex justify-between items-baseline gap-2">
                  <p className="font-display font-semibold uppercase tracking-wide truncate">{p.name}</p>
                  <p className="font-mono text-sm text-zinc-300 shrink-0">
                    {p.sale_price ? <><s className="text-zinc-600 mr-2">{eur(p.price)}</s><span className="text-brand-soft">{eur(p.sale_price)}</span></> : eur(p.price)}
                  </p>
                </div>
                <p className="font-mono text-[10px] text-zinc-500 mt-1 uppercase">{p.category} {p.sizes?.length ? `— ${p.sizes.join(" / ")}` : ""}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
