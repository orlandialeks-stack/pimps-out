export default function Marquee({ text, className = "" }) {
  const chunk = (text || "").repeat(6);
  return (
    <div className={`overflow-hidden border-y border-white/10 py-5 select-none ${className}`} data-testid="editorial-marquee">
      <div className="flex whitespace-nowrap animate-marquee">
        {[0, 1].map((i) => (
          <span key={i} className="font-display font-black uppercase italic text-3xl sm:text-5xl tracking-tight text-transparent pr-4"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.22)" }}>
            {chunk}
          </span>
        ))}
      </div>
    </div>
  );
}
