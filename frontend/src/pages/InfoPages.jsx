import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { API } from "../lib/api";
import { Reveal } from "../components/Reveal";

export function Faq() {
  const { content } = useOutletContext();
  const [open, setOpen] = useState(0);
  const faqs = content?.faq || [];
  return (
    <div className="px-4 sm:px-8 lg:px-16 py-16 max-w-4xl" data-testid="faq-page">
      <Reveal>
        <p className="eyebrow mb-3">ANSWERS</p>
        <h1 className="font-display font-black uppercase italic text-5xl sm:text-7xl mb-12">FAQ</h1>
      </Reveal>
      {faqs.map((f, i) => (
        <div key={i} className="border-b border-white/10">
          <button onClick={() => setOpen(open === i ? -1 : i)} data-testid={`faq-question-${i}`}
            className="w-full flex justify-between items-center py-5 text-left font-display font-semibold uppercase tracking-wide text-lg">
            {f.q}<ChevronDown size={18} className={`shrink-0 transition-transform ${open === i ? "rotate-180 text-brand" : ""}`} />
          </button>
          {open === i && <p className="pb-6 text-zinc-400 text-sm leading-relaxed" data-testid={`faq-answer-${i}`}>{f.a}</p>}
        </div>
      ))}
    </div>
  );
}

export function Shipping() {
  const { content } = useOutletContext();
  const paras = content?.shipping_returns?.paragraphs || [];
  return (
    <div className="px-4 sm:px-8 lg:px-16 py-16 max-w-4xl" data-testid="shipping-page">
      <Reveal>
        <p className="eyebrow mb-3">POLICY</p>
        <h1 className="font-display font-black uppercase italic text-5xl sm:text-7xl mb-12">Shipping & Returns</h1>
      </Reveal>
      {paras.map((p, i) => (
        <p key={i} className="text-zinc-300 leading-relaxed mb-6 text-sm sm:text-base" data-testid={`shipping-paragraph-${i}`}>{p}</p>
      ))}
    </div>
  );
}

export function Contact() {
  const { content } = useOutletContext();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/contact", form);
      setSent(true);
      toast.success("Message sent. We'll get back to you.");
    } catch { toast.error("Could not send. Try again."); }
  };
  return (
    <div className="px-4 sm:px-8 lg:px-16 py-16 grid lg:grid-cols-2 gap-14" data-testid="contact-page">
      <Reveal>
        <p className="eyebrow mb-3">GET IN TOUCH</p>
        <h1 className="font-display font-black uppercase italic text-5xl sm:text-7xl leading-[0.92]">Talk to us.</h1>
        <p className="mt-6 text-zinc-400 text-sm max-w-md">
          Questions about the drop, sizing, collaborations or anything else — we read everything.
        </p>
        {content?.contact?.email && (
          <p className="mt-6 font-mono text-sm text-brand-soft" data-testid="contact-email">{content.contact.email}</p>
        )}
      </Reveal>
      <Reveal delay={0.1}>
        {sent ? (
          <div className="card-dark p-10" data-testid="contact-success">
            <p className="font-display font-bold uppercase text-2xl">Message received.</p>
            <p className="text-zinc-400 text-sm mt-3">We reply as fast as we can. Meanwhile — create your own rules.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <input className="input-dark" placeholder="Name" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="contact-name" />
            <input className="input-dark" placeholder="Email" type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="contact-email-input" />
            <textarea className="input-dark min-h-[140px]" placeholder="Message" required value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="contact-message" />
            <button className="btn-primary self-start" data-testid="contact-submit">SEND MESSAGE</button>
          </form>
        )}
      </Reveal>
    </div>
  );
}
