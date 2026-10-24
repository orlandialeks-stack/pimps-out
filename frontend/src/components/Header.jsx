import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "../context/CartContext";

const links = [
  { to: "/shop", label: "SHOP" },
  { to: "/about", label: "PHILOSOPHY" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "CONTACT" },
];

export default function Header() {
  const { count, setDrawerOpen } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl bg-obsidian/75 border-b border-white/10" data-testid="site-header">
      <div className="px-4 sm:px-8 lg:px-16 h-16 sm:h-20 flex items-center justify-between">
        <Link to="/" data-testid="header-logo" className="flex items-center">
          <img src="/assets/logo-transparent.png" alt="PIMPS OUT" className="h-9 sm:h-11 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} data-testid={`nav-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `font-display font-semibold uppercase tracking-[0.2em] text-sm transition-colors ${isActive ? "text-brand-soft" : "text-zinc-300 hover:text-white"}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/account" data-testid="account-link" aria-label="Account"
            className="p-2 text-zinc-300 hover:text-brand-soft transition-colors">
            <User size={20} />
          </Link>
          <button onClick={() => setDrawerOpen(true)} data-testid="cart-drawer-toggle" aria-label="Cart"
            className="relative p-2 text-zinc-300 hover:text-brand-soft transition-colors">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span data-testid="cart-count" className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[10px] font-mono w-4 h-4 flex items-center justify-center rounded-full">
                {count}
              </span>
            )}
          </button>
          <button className="md:hidden p-2 text-zinc-300" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle" aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-white/10 bg-obsidian/95 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} data-testid={`nav-mobile-${l.label.toLowerCase()}`}
              className="font-display font-semibold uppercase tracking-[0.2em] text-base text-zinc-200">
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
