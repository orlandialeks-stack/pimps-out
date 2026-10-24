import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { API, fmtErr } from "../../lib/api";

const blank = { code: "", type: "percent", value: "", min_subtotal: 0, expires_at: "", active: true, usage_limit: "" };

export default function Discounts() {
  const qc = useQueryClient();
  const [f, setF] = useState(blank);
  const { data: discounts } = useQuery({
    queryKey: ["admin-discounts"],
    queryFn: async () => (await API.get("/admin/discounts")).data,
  });

  const save = async (e) => {
    e.preventDefault();
    try {
      await API.post("/admin/discounts", {
        ...f, value: parseFloat(f.value) || 0, min_subtotal: parseFloat(f.min_subtotal) || 0,
        expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null,
        usage_limit: f.usage_limit === "" ? null : parseInt(f.usage_limit),
      });
      qc.invalidateQueries({ queryKey: ["admin-discounts"] });
      setF(blank);
      toast.success("Discount created");
    } catch (err) { toast.error(fmtErr(err)); }
  };

  const toggle = async (d) => {
    await API.put(`/admin/discounts/${d.id}`, { code: d.code, type: d.type, value: d.value, min_subtotal: d.min_subtotal, expires_at: d.expires_at, active: !d.active, usage_limit: d.usage_limit });
    qc.invalidateQueries({ queryKey: ["admin-discounts"] });
  };
  const del = async (id) => {
    await API.delete(`/admin/discounts/${id}`);
    qc.invalidateQueries({ queryKey: ["admin-discounts"] });
  };

  return (
    <div data-testid="admin-discounts" className="max-w-3xl">
      <h1 className="font-display font-black uppercase italic text-3xl sm:text-4xl mb-8">Discount Codes</h1>
      <form onSubmit={save} className="card-dark p-6 grid sm:grid-cols-3 gap-3 mb-8">
        <input className="input-dark" placeholder="CODE *" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} data-testid="discount-code" />
        <select className="input-dark" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} data-testid="discount-type">
          <option value="percent">% percent</option>
          <option value="fixed">EUR fixed</option>
        </select>
        <input className="input-dark" placeholder="Value *" type="number" step="0.01" required value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} data-testid="discount-value" />
        <input className="input-dark" placeholder="Min subtotal (EUR)" type="number" step="0.01" value={f.min_subtotal} onChange={(e) => setF({ ...f, min_subtotal: e.target.value })} data-testid="discount-min" />
        <input className="input-dark" type="date" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} data-testid="discount-expiry" />
        <input className="input-dark" placeholder="Usage limit" type="number" value={f.usage_limit} onChange={(e) => setF({ ...f, usage_limit: e.target.value })} data-testid="discount-limit" />
        <button className="btn-primary sm:col-span-3 !py-3" data-testid="discount-save"><Plus size={14} /> CREATE CODE</button>
      </form>
      {discounts?.length === 0 && <div className="card-dark p-8 text-zinc-400 text-sm" data-testid="discounts-empty">No discount codes yet.</div>}
      <div className="flex flex-col gap-2">
        {(discounts || []).map((d) => (
          <div key={d.id} className="card-dark p-4 flex flex-wrap items-center gap-4" data-testid={`discount-${d.code}`}>
            <p className="font-mono font-bold flex-1">{d.code}</p>
            <p className="font-mono text-xs text-zinc-400">{d.type === "percent" ? `${d.value}%` : `EUR ${d.value}`}{d.min_subtotal ? ` · min EUR ${d.min_subtotal}` : ""}{d.expires_at ? ` · exp ${new Date(d.expires_at).toLocaleDateString()}` : ""} · used {d.used_count || 0}{d.usage_limit ? `/${d.usage_limit}` : ""}</p>
            <button onClick={() => toggle(d)} data-testid={`discount-toggle-${d.code}`}
              className={`font-mono text-[10px] px-2 py-1 border ${d.active ? "border-emerald-500 text-emerald-400" : "border-white/15 text-zinc-500"}`}>
              {d.active ? "ACTIVE" : "INACTIVE"}
            </button>
            <button onClick={() => del(d.id)} className="text-zinc-500 hover:text-brand" aria-label="Delete" data-testid={`discount-delete-${d.code}`}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
