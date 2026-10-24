import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { API, eur, imgUrl, fmtErr } from "../../lib/api";

export default function Products() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await API.get("/admin/products")).data,
  });

  const patch = async (p, changes) => {
    try {
      await API.put(`/admin/products/${p.id}`, { ...p, ...changes });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Saved");
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const del = async (p) => {
    if (!window.confirm(`Delete "${p.name}" permanently?`)) return;
    await API.delete(`/admin/products/${p.id}`);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    toast.success("Deleted");
  };

  return (
    <div data-testid="admin-products">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-black uppercase italic text-3xl sm:text-4xl">Products</h1>
        <Link to="/admin/products/new" className="btn-primary !px-5 !py-3" data-testid="new-product-button"><Plus size={16} /> NEW PRODUCT</Link>
      </div>
      {isLoading && <p className="font-mono text-zinc-500">LOADING…</p>}
      {products?.length === 0 && (
        <div className="card-dark p-8 text-zinc-400 text-sm" data-testid="products-empty">
          No products yet. Your catalogue starts empty — add pieces whenever your collection is ready.
        </div>
      )}
      <div className="flex flex-col gap-3">
        {(products || []).map((p) => (
          <div key={p.id} className="card-dark p-4 flex flex-wrap items-center gap-4" data-testid={`admin-product-${p.slug}`}>
            {p.images?.[0]
              ? <img src={imgUrl(p.images[0])} alt="" className="w-12 h-14 object-cover" />
              : <div className="w-12 h-14 bg-steel flex items-center justify-center font-mono text-[8px] text-zinc-600">NO IMG</div>}
            <div className="flex-1 min-w-[160px]">
              <p className="font-display font-semibold uppercase">{p.name}</p>
              <p className="font-mono text-[10px] text-zinc-500">{p.category || "uncategorised"} · {p.total_stock} in stock · {p.variants?.length || 0} variants</p>
            </div>
            <p className="font-mono text-sm">{p.sale_price ? <><s className="text-zinc-600 mr-2">{eur(p.price)}</s>{eur(p.sale_price)}</> : eur(p.price)}</p>
            <button onClick={() => patch(p, { featured: !p.featured })} data-testid={`feature-toggle-${p.slug}`}
              className={`font-mono text-[10px] px-2 py-1 border ${p.featured ? "border-brand text-brand-soft" : "border-white/15 text-zinc-500"}`}>
              {p.featured ? "FEATURED" : "FEATURE"}
            </button>
            <button onClick={() => patch(p, { status: p.status === "published" ? "draft" : "published" })} data-testid={`publish-toggle-${p.slug}`}
              className={`font-mono text-[10px] px-2 py-1 border ${p.status === "published" ? "border-emerald-500 text-emerald-400" : "border-white/15 text-zinc-500"}`}>
              {p.status === "published" ? "PUBLISHED" : "DRAFT"}
            </button>
            <Link to={`/preview/${p.slug}`} className="p-2 text-zinc-400 hover:text-white" aria-label="Preview" data-testid={`preview-${p.slug}`}><Eye size={16} /></Link>
            <Link to={`/admin/products/${p.id}`} className="p-2 text-zinc-400 hover:text-white" aria-label="Edit" data-testid={`edit-${p.slug}`}><Pencil size={16} /></Link>
            <button onClick={() => del(p)} className="p-2 text-zinc-500 hover:text-brand" aria-label="Delete" data-testid={`delete-${p.slug}`}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
