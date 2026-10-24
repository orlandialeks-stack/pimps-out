import { useQuery } from "@tanstack/react-query";
import { API } from "../../lib/api";

export default function Leads() {
  const { data: leads } = useQuery({ queryKey: ["admin-leads"], queryFn: async () => (await API.get("/admin/leads")).data });
  const { data: messages } = useQuery({ queryKey: ["admin-messages"], queryFn: async () => (await API.get("/admin/messages")).data });

  return (
    <div data-testid="admin-leads" className="grid lg:grid-cols-2 gap-10">
      <div>
        <h1 className="font-display font-black uppercase italic text-3xl mb-6">Email Leads</h1>
        {leads?.length === 0 && <div className="card-dark p-6 text-zinc-400 text-sm" data-testid="leads-empty">No signups yet.</div>}
        <div className="flex flex-col gap-2">
          {(leads || []).map((l) => (
            <div key={l.id} className="card-dark px-4 py-3 flex justify-between items-center" data-testid={`lead-${l.id.slice(-6)}`}>
              <p className="font-mono text-sm">{l.email}</p>
              <span className={`font-mono text-[10px] px-2 py-1 border ${l.source === "prelaunch" ? "border-brand text-brand-soft" : "border-white/15 text-zinc-500"}`}>{l.source.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h1 className="font-display font-black uppercase italic text-3xl mb-6">Messages</h1>
        {messages?.length === 0 && <div className="card-dark p-6 text-zinc-400 text-sm" data-testid="messages-empty">No contact messages yet.</div>}
        <div className="flex flex-col gap-2">
          {(messages || []).map((m) => (
            <div key={m.id} className="card-dark p-4" data-testid={`message-${m.id.slice(-6)}`}>
              <p className="font-mono text-xs text-brand-soft">{m.name} — {m.email}</p>
              <p className="text-sm text-zinc-300 mt-2">{m.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
