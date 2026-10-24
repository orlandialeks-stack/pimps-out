import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload, Eye } from "lucide-react";
import { toast } from "sonner";
import { API, imgUrl, fmtErr } from "../../lib/api";

const blank = {
  name: "", description: "", price: "", sale_price: "", category: "", collection: "",
  images: [], variants: [], material: "", gsm: "", fit: "", care: "", size_guide: "",
  status: "draft", featured: false, sort_order: 0,
};

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState(blank);
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const { data: taxonomies } = useQuery({ queryKey: ["taxonomies"], queryFn: async () => (await API.get("/taxonomies")).data });
  useEffect(() => {
    if (id) API.get(`/admin/products/${id}`).then((r) => {
      const { id: _i, slug: s, total_stock, sizes, colors, created_at, updated_at, ...rest } = r.data;
      setSlug(s);
      setF({ ...blank, ...rest, sale_price: rest.sale_price ?? "", gsm: rest.gsm ?? "" });
    }).catch(() => toast.error("Product not found"));
  }, [id]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setVariant = (i, k, v) => setF((p) => {
    const vs = [...p.variants]; vs[i] = { ...vs[i], [k]: v }; return { ...p, variants: vs };
  });

  const upload = async (files) => {
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const { data } = await API.post("/admin/uploads", fd);
        set("images", [...f.images, data.url]);
      } catch (e) { toast.error(fmtErr(e)); }
    }
  };

  const addTaxonomy = async (type, name) => {
    if (!name) return;
    try {
      await API.post("/admin/taxonomies", { type, name });
      qc.invalidateQueries({ queryKey: ["taxonomies"] });
    } catch { /* exists */ }
  };

  const save = async (status) => {
    if (!f.name.trim()) return toast.error("Product name is required");
    setBusy(true);
    const payload = {
      ...f,
      status: status || f.status,
      price: parseFloat(f.price) || 0,
      sale_price: f.sale_price === "" ? null : parseFloat(f.sale_price),
      gsm: f.gsm === "" ? null : parseInt(f.gsm),
      sort_order: parseInt(f.sort_order) || 0,
      variants: f.variants.map((v) => ({
        ...v, stock: parseInt(v.stock) || 0,
        sku: v.sku || `${f.name.slice(0, 3)}-${v.size}-${v.color}`.replace(/\s+/g, "").toUpperCase(),
      })),
    };
    try {
      if (isNew) await API.post("/admin/products", payload);
      else await API.put(`/admin/products/${id}`, payload);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product saved");
      nav("/admin/products");
    } catch (e) { toast.error(fmtErr(e)); }
    setBusy(false);
  };

  const cats = (taxonomies || []).filter((t) => t.type === "category");
  const colls = (taxonomies || []).filter((t) => t.type === "collection");

  return (
    <div className="max-w-4xl" data-testid="product-form">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="font-display font-black uppercase italic text-3xl">{isNew ? "New Product" : "Edit Product"}</h1>
        {slug && <Link to={`/preview/${slug}`} className="btn-outline !px-5 !py-3" data-testid="preview-product-button"><Eye size={14} /> PREVIEW</Link>}
      </div>

      <div className="card-dark p-6 flex flex-col gap-4 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Basics</p>
        <input className="input-dark" placeholder="Product name *" value={f.name} onChange={(e) => set("name", e.target.value)} data-testid="pf-name" />
        <textarea className="input-dark min-h-[100px]" placeholder="Description" value={f.description} onChange={(e) => set("description", e.target.value)} data-testid="pf-description" />
        <div className="grid grid-cols-2 gap-4">
          <input className="input-dark" placeholder="Price (EUR) *" type="number" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} data-testid="pf-price" />
          <input className="input-dark" placeholder="Sale price (optional)" type="number" step="0.01" value={f.sale_price} onChange={(e) => set("sale_price", e.target.value)} data-testid="pf-sale-price" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex gap-2">
            <select className="input-dark" value={f.category} onChange={(e) => set("category", e.target.value)} data-testid="pf-category">
              <option value="">Category…</option>
              {cats.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <button type="button" className="btn-outline !px-3 !py-2 text-xs" data-testid="pf-add-category"
              onClick={() => { const n = window.prompt("New category name"); if (n) { addTaxonomy("category", n); set("category", n); } }}>+</button>
          </div>
          <div className="flex gap-2">
            <select className="input-dark" value={f.collection} onChange={(e) => set("collection", e.target.value)} data-testid="pf-collection">
              <option value="">Collection…</option>
              {colls.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <button type="button" className="btn-outline !px-3 !py-2 text-xs" data-testid="pf-add-collection"
              onClick={() => { const n = window.prompt("New collection name"); if (n) { addTaxonomy("collection", n); set("collection", n); } }}>+</button>
          </div>
        </div>
        <div className="flex gap-6 items-center flex-wrap">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} data-testid="pf-featured" /> Featured on homepage
          </label>
          <input className="input-dark !w-32" placeholder="Sort order" type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} data-testid="pf-sort" />
        </div>
      </div>

      <div className="card-dark p-6 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Photographs</p>
        <div className="flex flex-wrap gap-3 mb-4">
          {f.images.map((img, i) => (
            <div key={i} className="relative group">
              <img src={imgUrl(img)} alt="" className="w-20 h-24 object-cover border border-white/10" />
              <button onClick={() => set("images", f.images.filter((_, j) => j !== i))} data-testid={`pf-remove-image-${i}`}
                className="absolute -top-2 -right-2 bg-brand text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} data-testid="pf-upload-button"
            className="w-20 h-24 border border-dashed border-white/20 flex flex-col items-center justify-center text-zinc-500 hover:border-brand hover:text-brand-soft transition-colors">
            <Upload size={18} /><span className="font-mono text-[8px] mt-1">UPLOAD</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload([...e.target.files])} data-testid="pf-file-input" />
        </div>
      </div>

      <div className="card-dark p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Variants — sizes, colours, stock, SKU</p>
          <button onClick={() => set("variants", [...f.variants, { sku: "", size: "", color: "", color_hex: "#111111", stock: 0, image: "" }])}
            className="btn-outline !px-3 !py-2 text-xs" data-testid="pf-add-variant"><Plus size={12} /> ADD VARIANT</button>
        </div>
        {f.variants.length === 0 && <p className="text-zinc-600 text-sm">No variants yet. Add at least one size/colour combination with stock before publishing.</p>}
        {f.variants.map((v, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-2 items-center" data-testid={`pf-variant-${i}`}>
            <input className="input-dark !py-2" placeholder="Size (S, M…)" value={v.size} onChange={(e) => setVariant(i, "size", e.target.value)} data-testid={`pf-variant-size-${i}`} />
            <input className="input-dark !py-2" placeholder="Colour" value={v.color} onChange={(e) => setVariant(i, "color", e.target.value)} data-testid={`pf-variant-color-${i}`} />
            <input type="color" className="input-dark !py-1 !px-1 h-10" value={v.color_hex} onChange={(e) => setVariant(i, "color_hex", e.target.value)} data-testid={`pf-variant-hex-${i}`} />
            <input className="input-dark !py-2" placeholder="Stock" type="number" value={v.stock} onChange={(e) => setVariant(i, "stock", e.target.value)} data-testid={`pf-variant-stock-${i}`} />
            <input className="input-dark !py-2" placeholder="SKU (auto)" value={v.sku} onChange={(e) => setVariant(i, "sku", e.target.value)} data-testid={`pf-variant-sku-${i}`} />
            <button onClick={() => set("variants", f.variants.filter((_, j) => j !== i))} className="text-zinc-500 hover:text-brand justify-self-center" data-testid={`pf-variant-del-${i}`}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <div className="card-dark p-6 flex flex-col gap-4 mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Specifications</p>
        <div className="grid grid-cols-2 gap-4">
          <input className="input-dark" placeholder="Material (e.g. 100% heavyweight cotton)" value={f.material} onChange={(e) => set("material", e.target.value)} data-testid="pf-material" />
          <input className="input-dark" placeholder="Fabric weight GSM" type="number" value={f.gsm} onChange={(e) => set("gsm", e.target.value)} data-testid="pf-gsm" />
        </div>
        <input className="input-dark" placeholder="Fit (e.g. oversized, boxy)" value={f.fit} onChange={(e) => set("fit", e.target.value)} data-testid="pf-fit" />
        <textarea className="input-dark" placeholder="Care instructions" value={f.care} onChange={(e) => set("care", e.target.value)} data-testid="pf-care" />
        <textarea className="input-dark" placeholder="Size guide" value={f.size_guide} onChange={(e) => set("size_guide", e.target.value)} data-testid="pf-size-guide" />
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => save("draft")} disabled={busy} className="btn-outline disabled:opacity-50" data-testid="pf-save-draft">SAVE AS DRAFT</button>
        <button onClick={() => save("published")} disabled={busy} className="btn-primary disabled:opacity-50" data-testid="pf-publish">{busy ? "SAVING…" : "SAVE & PUBLISH"}</button>
      </div>
    </div>
  );
}
