import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { API, fmtErr } from "../../lib/api";

const TABS = ["Homepage", "Coming Soon", "About", "FAQ", "Shipping & Returns", "Contact & Social"];

export default function Content() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [c, setC] = useState(null);
  const fileRef = useRef(null);
  const imgTarget = useRef(null);
  const { data } = useQuery({ queryKey: ["content"], queryFn: async () => (await API.get("/content")).data });

  useEffect(() => { if (data && !c) setC(JSON.parse(JSON.stringify(data))); }, [data, c]);
  if (!c) return <p className="font-mono text-zinc-500">LOADING…</p>;

  const set = (path, v) => setC((prev) => {
    const next = { ...prev };
    const keys = path.split(".");
    let o = next;
    keys.slice(0, -1).forEach((k) => { o[k] = { ...o[k] }; o = o[k]; });
    o[keys[keys.length - 1]] = v;
    return next;
  });

  const save = async () => {
    try {
      await API.put("/admin/content", c);
      qc.invalidateQueries({ queryKey: ["content"] });
      toast.success("Site content updated — live immediately");
    } catch (e) { toast.error(fmtErr(e)); }
  };

  const upload = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data: r } = await API.post("/admin/uploads", fd);
      set(imgTarget.current, r.url);
      toast.success("Image uploaded");
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const pickImage = (path) => { imgTarget.current = path; fileRef.current?.click(); };

  const Field = ({ label, path, textarea, testid }) => (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
      {textarea
        ? <textarea className="input-dark mt-1 min-h-[90px]" value={path.split(".").reduce((o, k) => o?.[k], c) ?? ""} onChange={(e) => set(path, e.target.value)} data-testid={testid} />
        : <input className="input-dark mt-1" value={path.split(".").reduce((o, k) => o?.[k], c) ?? ""} onChange={(e) => set(path, e.target.value)} data-testid={testid} />}
    </label>
  );

  return (
    <div className="max-w-3xl" data-testid="admin-content">
      <h1 className="font-display font-black uppercase italic text-3xl sm:text-4xl mb-6">Site Content</h1>
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} data-testid={`content-tab-${i}`}
            className={`font-mono text-[10px] uppercase tracking-widest px-3 py-2 border ${tab === i ? "border-brand text-brand-soft" : "border-white/10 text-zinc-500"}`}>{t}</button>
        ))}
      </div>

      <div className="card-dark p-6 flex flex-col gap-4 mb-6">
        {tab === 0 && (<>
          <Field label="Hero headline — line 1" path="hero.line1" testid="ct-hero-line1" />
          <Field label="Hero headline — line 2" path="hero.line2" testid="ct-hero-line2" />
          <Field label="Hero supporting text" path="hero.subtext" textarea testid="ct-hero-subtext" />
          <Field label="Primary button label" path="hero.cta_primary" testid="ct-hero-cta1" />
          <Field label="Secondary button label" path="hero.cta_secondary" testid="ct-hero-cta2" />
          <Field label="Marquee text" path="marquee_text" testid="ct-marquee" />
          <button onClick={() => pickImage("hero.image")} className="btn-outline !py-2 text-xs self-start" data-testid="ct-hero-image"><Upload size={12} /> UPLOAD HERO IMAGE</button>
          {c.hero?.image && <p className="font-mono text-[10px] text-zinc-500 break-all">{c.hero.image}</p>}
        </>)}
        {tab === 1 && (<>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={!!c.coming_soon?.enabled} onChange={(e) => set("coming_soon.enabled", e.target.checked)} data-testid="ct-coming-soon-toggle" />
            Show coming-soon section on the homepage
          </label>
          <Field label="Title" path="coming_soon.title" testid="ct-cs-title" />
          <Field label="Message" path="coming_soon.message" textarea testid="ct-cs-message" />
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Launch date (optional countdown)</span>
            <input type="datetime-local" className="input-dark mt-1" value={c.coming_soon?.launch_date || ""}
              onChange={(e) => set("coming_soon.launch_date", e.target.value)} data-testid="ct-cs-date" />
          </label>
        </>)}
        {tab === 2 && (<>
          <Field label="About title" path="about.title" testid="ct-about-title" />
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Paragraphs (one per line)</span>
            <textarea className="input-dark mt-1 min-h-[160px]" value={(c.about?.paragraphs || []).join("\n")}
              onChange={(e) => set("about.paragraphs", e.target.value.split("\n").filter(Boolean))} data-testid="ct-about-paragraphs" />
          </label>
          <button onClick={() => pickImage("about.image")} className="btn-outline !py-2 text-xs self-start" data-testid="ct-about-image"><Upload size={12} /> UPLOAD ABOUT IMAGE</button>
        </>)}
        {tab === 3 && (<>
          {(c.faq || []).map((f, i) => (
            <div key={i} className="border border-white/10 p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="font-mono text-[10px] text-zinc-500">Q{i + 1}</p>
                <button onClick={() => set("faq", c.faq.filter((_, j) => j !== i))} className="text-zinc-500 hover:text-brand" data-testid={`ct-faq-del-${i}`}><Trash2 size={14} /></button>
              </div>
              <input className="input-dark" value={f.q} placeholder="Question"
                onChange={(e) => set("faq", c.faq.map((x, j) => j === i ? { ...x, q: e.target.value } : x))} data-testid={`ct-faq-q-${i}`} />
              <textarea className="input-dark" value={f.a} placeholder="Answer"
                onChange={(e) => set("faq", c.faq.map((x, j) => j === i ? { ...x, a: e.target.value } : x))} data-testid={`ct-faq-a-${i}`} />
            </div>
          ))}
          <button onClick={() => set("faq", [...(c.faq || []), { q: "", a: "" }])} className="btn-outline !py-2 text-xs self-start" data-testid="ct-faq-add"><Plus size={12} /> ADD QUESTION</button>
        </>)}
        {tab === 4 && (
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Shipping & returns (one paragraph per line)</span>
            <textarea className="input-dark mt-1 min-h-[180px]" value={(c.shipping_returns?.paragraphs || []).join("\n")}
              onChange={(e) => set("shipping_returns.paragraphs", e.target.value.split("\n").filter(Boolean))} data-testid="ct-shipping" />
          </label>
        )}
        {tab === 5 && (<>
          <Field label="Contact email" path="contact.email" testid="ct-contact-email" />
          <Field label="Instagram URL" path="contact.instagram" testid="ct-instagram" />
          <Field label="TikTok URL" path="contact.tiktok" testid="ct-tiktok" />
          <Field label="X (Twitter) URL" path="contact.x" testid="ct-x" />
          <Field label="YouTube URL" path="contact.youtube" testid="ct-youtube" />
          <Field label="Newsletter title" path="newsletter.title" testid="ct-newsletter-title" />
          <Field label="Newsletter text" path="newsletter.text" textarea testid="ct-newsletter-text" />
        </>)}
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
      <button onClick={save} className="btn-primary" data-testid="content-save">SAVE ALL CHANGES</button>
    </div>
  );
}
