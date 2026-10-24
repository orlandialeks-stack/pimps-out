import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { API, imgUrl, eur } from "../lib/api";
import { MaskedLine, Reveal } from "../components/Reveal";
import Marquee from "../components/Marquee";

const HERO_BG = "https://images.unsplash.com/photo-1528120369764-0423708119ae?crop=entropy&cs=srgb&fm=jpg&q=85";
const LOOKS = [
  "https://images.unsplash.com/photo-1756451182421-d2a1961638c9?crop=entropy&cs=srgb&fm=jpg&q=85",
  "https://images.unsplash.com/photo-1532074198010-97d0c3700b7a?crop=entropy&cs=srgb&fm=jpg&q=85",
  "https://images.unsplash.com/photo-1697924293303-34488b60bf36?crop=entropy&cs=srgb&fm=jpg&q=85",
];

function useCountdown(target) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    if (!target) { setLeft(""); return; }
    const tick = () => {
      const d = new Date(target) - Date.now();
      if (d <= 0) return setLeft("LIVE SOON");
      const days = Math.floor(d / 864e5), h = Math.floor(d / 36e5) % 24, m = Math.floor(d / 6e4) % 60, s = Math.floor(d / 1e3) % 60;
      setLeft(`${days}D : ${String(h).padStart(2, "0")}H : ${String(m).padStart(2, "0")}M : ${String(s).padStart(2, "0")}S`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

function NotifyForm({ source }) {
  const [email, setEmail] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/leads", { email, source });
      toast.success("Locked in. You'll hear from us first.");
      setEmail("");
    } catch { toast.error("Could not save your email"); }
  };
  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-lg">
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
        placeholder="your@email.com" className="input-dark flex-1" data-testid="pre-launch-notify-input" />
      <button className="btn-primary" data-testid="pre-launch-notify-submit">NOTIFY ME</button>
    </form>
  );
}

export default function Home() {
  const { content } = useOutletContext();
  const hero = content?.hero || {};
  const cs = content?.coming_soon || {};
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const countdown = useCountdown(cs.launch_date);

  const { data: featured } = useQuery({
    queryKey: ["featured"],
    queryFn: async () => (await API.get("/products?featured=true")).data,
  });

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section ref={ref} className="relative min-h-[92vh] flex items-end overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: bgY }}>
          <img src={hero.image ? imgUrl(hero.image) : HERO_BG} alt="" className="w-full h-[120%] object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/20" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 70% 30%, rgba(232,39,42,0.12), transparent 60%)" }} />
        </motion.div>
        <motion.div style={{ opacity: fade }} className="relative w-full px-4 sm:px-8 lg:px-16 pb-20 pt-40">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 1 }}
            className="eyebrow mb-6">PIMPS OUT — EST. ON OUR OWN TERMS</motion.p>
          <h1 className="font-display font-black uppercase italic leading-[0.9] tracking-tight text-5xl sm:text-7xl lg:text-8xl" data-testid="hero-headline">
            <MaskedLine delay={0.35}>{hero.line1 || "We don't follow trends."}</MaskedLine>
            <MaskedLine delay={0.55} className="text-brand">{hero.line2 || "We create our own rules."}</MaskedLine>
          </h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-6 max-w-xl text-zinc-300 text-sm sm:text-base" data-testid="hero-subtext">
            {hero.subtext || "PIMPS OUT — Premium streetwear for those who choose their own direction."}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-10 flex flex-wrap gap-4">
            <Link to="/shop" className="btn-primary" data-testid="shop-collection-button">
              {hero.cta_primary || "SHOP COLLECTION"} <ArrowRight size={16} />
            </Link>
            <Link to="/about" className="btn-outline" data-testid="discover-philosophy-button">
              {hero.cta_secondary || "DISCOVER OUR PHILOSOPHY"}
            </Link>
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
          className="absolute bottom-6 right-6 sm:right-16 text-zinc-500"><ArrowDown size={18} className="animate-bounce" /></motion.div>
      </section>

      <Marquee text={content?.marquee_text} />

      {/* COMING SOON / PRE-LAUNCH */}
      {cs.enabled && (
        <section className="px-4 sm:px-8 lg:px-16 py-20 lg:py-28" data-testid="coming-soon-section">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <p className="eyebrow mb-4">PRE-LAUNCH</p>
              <h2 className="font-display font-black uppercase italic text-4xl sm:text-6xl leading-[0.95]" data-testid="coming-soon-title">
                {cs.title || "COLLECTION 001 — COMING SOON"}
              </h2>
              <p className="mt-5 text-zinc-400 max-w-md">{cs.message}</p>
              <div className="mt-8"><NotifyForm source="prelaunch" /></div>
            </Reveal>
            <Reveal delay={0.15} className="relative">
              <div className="clip-frame aspect-[4/5] max-h-[520px] w-full overflow-hidden bg-coal">
                <img src={LOOKS[0]} alt="PIMPS OUT editorial" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              {countdown && (
                <div className="absolute -bottom-5 left-6 bg-brand px-5 py-3" data-testid="launch-countdown">
                  <span className="font-mono text-sm tracking-widest text-white">{countdown}</span>
                </div>
              )}
            </Reveal>
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      {featured?.length > 0 && (
        <section className="px-4 sm:px-8 lg:px-16 py-16" data-testid="featured-section">
          <Reveal className="flex items-end justify-between mb-10">
            <h2 className="font-display font-black uppercase italic text-4xl sm:text-5xl">Featured</h2>
            <Link to="/shop" className="font-mono text-xs text-zinc-400 hover:text-brand-soft uppercase tracking-widest">View all →</Link>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <Link to={`/shop/${p.slug}`} className="group block" data-testid={`featured-product-${i}`}>
                  <div className="aspect-[3/4] overflow-hidden bg-coal relative">
                    {p.images?.[0] && <img src={imgUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                    {p.total_stock === 0 && <span className="absolute top-3 left-3 bg-steel font-mono text-[10px] px-2 py-1">SOLD OUT</span>}
                  </div>
                  <div className="mt-3 flex justify-between items-baseline">
                    <p className="font-display font-semibold uppercase tracking-wide">{p.name}</p>
                    <p className="font-mono text-sm text-zinc-300">
                      {p.sale_price ? <><s className="text-zinc-600 mr-2">{eur(p.price)}</s><span className="text-brand-soft">{eur(p.sale_price)}</span></> : eur(p.price)}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* EDITORIAL BENTO */}
      <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-24" data-testid="editorial-section">
        <Reveal><p className="eyebrow mb-4">THE CODE</p></Reveal>
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          <Reveal className="col-span-12 lg:col-span-7 relative overflow-hidden clip-frame min-h-[320px] lg:min-h-[480px]">
            <img src={LOOKS[1]} alt="Editorial" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/90 to-transparent" />
            <div className="absolute bottom-0 p-6 sm:p-10">
              <h3 className="font-display font-black uppercase italic text-3xl sm:text-5xl leading-[0.95]">Individuality is the uniform.</h3>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="col-span-12 sm:col-span-6 lg:col-span-5 relative overflow-hidden clip-frame min-h-[240px] lg:min-h-[480px]">
            <img src={LOOKS[2]} alt="Editorial" className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </Reveal>
          <Reveal delay={0.15} className="col-span-12 sm:col-span-6 lg:col-span-5 bg-coal border border-white/10 p-8 sm:p-12 flex flex-col justify-center">
            <p className="font-mono text-xs text-brand-soft tracking-[0.3em] mb-4">001 / PHILOSOPHY</p>
            <p className="font-display font-bold uppercase text-2xl sm:text-3xl leading-tight">
              Confidence. Creativity. Contemporary streetwear — without permission.
            </p>
            <Link to="/about" className="mt-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-brand-soft transition-colors">
              Read the philosophy <ArrowRight size={14} />
            </Link>
          </Reveal>
          <Reveal delay={0.2} className="col-span-12 lg:col-span-7 bg-steel border border-white/10 p-8 sm:p-12 flex items-center">
            <p className="font-display font-black uppercase italic text-3xl sm:text-5xl leading-[0.95] text-zinc-200">
              "We don't follow trends. <span className="text-brand">We create our own rules.</span>"
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
