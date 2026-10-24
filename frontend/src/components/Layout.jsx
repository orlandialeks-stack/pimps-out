import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { useQuery } from "@tanstack/react-query";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import AssistantWidget from "./AssistantWidget";
import { API } from "../lib/api";

export default function Layout() {
  const { pathname } = useLocation();
  const { data: content } = useQuery({
    queryKey: ["content"],
    queryFn: async () => (await API.get("/content")).data,
    staleTime: 30_000,
  });

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let raf;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-obsidian">
      <Header />
      <main className="flex-1 pt-16 sm:pt-20">
        <Outlet context={{ content }} />
      </main>
      <Footer content={content} />
      <CartDrawer />
      <AssistantWidget />
    </div>
  );
}
