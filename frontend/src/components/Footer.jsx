import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Instagram, Music2, Twitter, Youtube } from "lucide-react";
import { API } from "../lib/api";

export default function Footer({ content }) {
  const [email, setEmail] = useState("");
  const socials = content?.contact || {};

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await API.post("/leads", { email, source: "newsletter" });
      toast.success("You're on the list. Welcome to the movement.");
      setEmail("");
    } catch {
      toast.error("Could not save your email. Try again.");
    }
  };

  return (
    <footer className="border-t border-white/10 bg-coal" data-testid="site-footer">
      <div className="px-4 sm:px-8 lg:px-16 py-14 grid gap-12 md:grid-cols-3">
        <div>
          <img src="/assets/logo-transparent.png" alt="PIMPS OUT" className="h-12 w-auto mb-5" />
          <p className="font-display font-bold uppercase italic text-lg leading-tight text-zinc-200">
            We don't follow trends.<br />We create our own rules.
          </p>
        </div>
        <div className="flex flex-col gap-3 font-display uppercase tracking-[0.2em] text-sm">
          <Link to="/shop" className="text-zinc-400 hover:text-white transition-colors" data-testid="footer-shop">Shop</Link>
          <Link to="/about" className="text-zinc-400 hover:text-white transition-colors" data-testid="footer-about">Philosophy</Link>
          <Link to="/shipping" className="text-zinc-400 hover:text-white transition-colors" data-testid="footer-shipping">Shipping & Returns</Link>
          <Link to="/faq" className="text-zinc-400 hover:text-white transition-colors" data-testid="footer-faq">FAQ</Link>
          <Link to="/contact" className="text-zinc-400 hover:text-white transition-colors" data-testid="footer-contact">Contact</Link>
        </div>
        <div>
          <p className="eyebrow mb-3">{content?.newsletter?.title || "JOIN THE MOVEMENT"}</p>
          <p className="text-sm text-zinc-400 mb-4">{content?.newsletter?.text}</p>
          <form onSubmit={subscribe} className="flex gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
              placeholder="your@email.com" className="input-dark" data-testid="footer-newsletter-input" />
            <button className="btn-primary !px-5 !py-3" data-testid="footer-newsletter-submit">JOIN</button>
          </form>
          <div className="flex gap-4 mt-6">
            {socials.instagram && <a href={socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" data-testid="social-instagram" className="text-zinc-400 hover:text-brand-pink"><Instagram size={18} /></a>}
            {socials.tiktok && <a href={socials.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" data-testid="social-tiktok" className="text-zinc-400 hover:text-brand-pink"><Music2 size={18} /></a>}
            {socials.x && <a href={socials.x} target="_blank" rel="noreferrer" aria-label="X" data-testid="social-x" className="text-zinc-400 hover:text-brand-pink"><Twitter size={18} /></a>}
            {socials.youtube && <a href={socials.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" data-testid="social-youtube" className="text-zinc-400 hover:text-brand-pink"><Youtube size={18} /></a>}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 sm:px-8 lg:px-16 py-5 flex flex-col sm:flex-row justify-between gap-2">
        <p className="font-mono text-xs text-zinc-500">© {new Date().getFullYear()} PIMPS OUT. All rights reserved.</p>
        <p className="font-mono text-xs text-zinc-600">RELEASE 001 — FORTHCOMING</p>
      </div>
    </footer>
  );
}
