import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

const BACKEND = process.env.REACT_APP_BACKEND_URL;
const LANGS = [
  { code: "en", label: "EN" },
  { code: "it", label: "IT" },
  { code: "es", label: "ES" },
  { code: "ru", label: "RU" },
];

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const sessionId = useRef(`s-${Math.random().toString(36).slice(2)}`);
  const recorder = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const speak = async (text) => {
    if (!voiceOn) return;
    try {
      const r = await fetch(`${BACKEND}/api/assistant/tts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) return;
      const blob = await r.blob();
      new Audio(URL.createObjectURL(blob)).play();
    } catch { /* voice optional */ }
  };

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setBusy(true);
    setMessages((m) => [...m, { role: "assistant", text: "" }]);
    try {
      const r = await fetch(`${BACKEND}/api/assistant/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId.current, message: msg, language: lang }),
      });
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop();
        for (const p of parts) {
          if (!p.startsWith("data: ")) continue;
          const payload = p.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const j = JSON.parse(payload);
            if (j.delta) {
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = { role: "assistant", text: next[next.length - 1].text + j.delta };
                return next;
              });
            }
            if (j.error) throw new Error(j.error);
          } catch (e) { if (e.message && !e.message.includes("JSON")) throw e; }
        }
      }
      setMessages((m) => { speak(m[m.length - 1]?.text || ""); return m; });
    } catch {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "assistant", text: "Connection issue — please try again, or reach us via the contact page." };
        return next;
      });
    }
    setBusy(false);
  };

  const toggleRecord = async () => {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const fd = new FormData();
        fd.append("file", new Blob(chunks, { type: "audio/webm" }), "voice.webm");
        try {
          const r = await fetch(`${BACKEND}/api/assistant/stt`, { method: "POST", body: fd });
          const j = await r.json();
          if (j.text) send(j.text);
        } catch { toast.error("Could not understand the audio"); }
      };
      rec.start();
      recorder.current = rec;
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} data-testid="ai-assistant-widget-trigger" aria-label="Shopping assistant"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 bg-brand hover:bg-brand-soft transition-colors flex items-center justify-center shadow-[0_0_30px_rgba(232,39,42,0.4)]">
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3 }} data-testid="ai-assistant-panel"
            className="fixed bottom-24 right-5 z-40 w-[calc(100vw-40px)] sm:w-[380px] h-[520px] max-h-[70vh] bg-coal border border-white/10 flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="font-display font-bold uppercase tracking-[0.15em]">PO Assistant</p>
                <p className="font-mono text-[10px] text-zinc-500">WE DON'T FOLLOW TRENDS</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={lang} onChange={(e) => setLang(e.target.value)} data-testid="assistant-language-select"
                  className="bg-steel border border-white/10 text-xs font-mono px-2 py-1">
                  {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                <button onClick={() => setVoiceOn(!voiceOn)} aria-label="Toggle voice" data-testid="assistant-voice-toggle"
                  className="text-zinc-400 hover:text-brand-soft">
                  {voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" data-testid="assistant-messages">
              {messages.length === 0 && (
                <p className="text-zinc-500 text-sm">Ask me anything about PIMPS OUT — the drop, sizing, shipping, or the philosophy.</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${m.role === "user"
                  ? "self-end bg-brand text-white" : "self-start bg-steel text-zinc-200"}`}>
                  {m.text || (busy && m.role === "assistant" ? <span className="animate-pulse">…</span> : null)}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type or speak…" className="input-dark !py-2.5" data-testid="assistant-input" />
              <button onClick={toggleRecord} aria-label="Voice input" data-testid="assistant-mic-button"
                className={`p-2.5 border ${recording ? "border-brand text-brand animate-pulse" : "border-white/15 text-zinc-300 hover:border-brand"}`}>
                {recording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button onClick={() => send()} disabled={busy} data-testid="assistant-send-button"
                className="p-2.5 bg-brand hover:bg-brand-soft text-white disabled:opacity-40">
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
