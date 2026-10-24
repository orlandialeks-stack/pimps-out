import { useOutletContext } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import Marquee from "../components/Marquee";
import { imgUrl } from "../lib/api";

const ABOUT_IMG = "https://images.pexels.com/photos/18956666/pexels-photo-18956666.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function About() {
  const { content } = useOutletContext();
  const about = content?.about || {};
  return (
    <div data-testid="about-page">
      <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-24">
        <Reveal>
          <p className="eyebrow mb-4">OUR PHILOSOPHY</p>
          <h1 className="font-display font-black uppercase italic text-4xl sm:text-6xl lg:text-7xl leading-[0.92] max-w-5xl" data-testid="about-title">
            {about.title || "We don't follow trends. We create our own rules."}
          </h1>
        </Reveal>
        <div className="grid lg:grid-cols-2 gap-12 mt-14 items-start">
          <Reveal className="flex flex-col gap-6">
            {(about.paragraphs || []).map((p, i) => (
              <p key={i} className="text-zinc-300 leading-relaxed text-sm sm:text-base" data-testid={`about-paragraph-${i}`}>{p}</p>
            ))}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {["INDIVIDUALITY", "CONFIDENCE", "CREATIVITY"].map((v) => (
                <div key={v} className="card-dark p-5 text-center">
                  <p className="font-display font-bold uppercase tracking-[0.15em] text-sm text-brand-soft">{v}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="clip-frame overflow-hidden aspect-[4/5] max-h-[560px]">
              <img src={about.image ? imgUrl(about.image) : ABOUT_IMG} alt="PIMPS OUT campaign"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </Reveal>
        </div>
      </section>
      <Marquee text={content?.marquee_text} />
    </div>
  );
}
