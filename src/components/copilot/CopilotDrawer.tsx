import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { buildCopilotContext, saveAIArtifact } from "@/lib/copilotContext";
import type { CopilotPayload } from "./CopilotButton";
import { motion } from "framer-motion";

type Msg = { role: "user" | "assistant"; content: string };

export default function CopilotDrawer() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const messagesRef = useRef<Msg[]>([]);
  const [input, setInput] = useState("");
  const [focus, setFocus] = useState<{ runId?: string; drug?: string; gene?: string }>({});
  const [mode, setMode] = useState<"student" | "clinician">(
    (localStorage.getItem("pharmaguard.copilot_mode") as "student" | "clinician") || "student",
  );
  const [typing, setTyping] = useState(false);
  const [queuedPrompt, setQueuedPrompt] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [aiError, setAiError] = useState<string>("");

  useEffect(() => {
    messagesRef.current = msgs;
  }, [msgs]);

  useEffect(() => {
    const handler = (e: CustomEvent<CopilotPayload>) => {
      setFocus(e.detail || {});
      setOpen(true);
      if (e.detail?.prefill) setQueuedPrompt(e.detail.prefill);
    };
    // @ts-expect-error Custom event name mapping
    window.addEventListener("openCopilot", handler as EventListener);
    return () => {
      // @ts-expect-error Custom event name mapping
      window.removeEventListener("openCopilot", handler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!open || !queuedPrompt) return;
    const p = queuedPrompt;
    setQueuedPrompt(null);
    queueMicrotask(() => {
      void sendMessage(p);
    });
  }, [open, queuedPrompt]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/ai/ping")
      .then((r) => r.json().catch(() => ({ ok: false })))
      .then((j) => {
        setAiEnabled(!!j?.ok);
        setAiError(j?.error || "");
      })
      .catch(() => {
        setAiEnabled(false);
        setAiError("network error");
      });
  }, [open]);

  const context = useMemo(() => buildCopilotContext(focus.runId, { drug: focus.drug, gene: focus.gene }), [focus]);

  function setAndPersistMode(m: "student" | "clinician") {
    setMode(m);
    localStorage.setItem("pharmaguard.copilot_mode", m);
    if (focus.runId) saveAIArtifact(focus.runId, "mode", m);
  }

  async function sendMessage(textOverride?: string) {
    if (typing) return;
    const content = (textOverride ?? input).trim();
    if (!content) return;
    const enforced =
      /summary/i.test(content)
        ? `${content}\n\nPlease provide 3–6 bullet points. For any genetic rationale, cite evidence ids in brackets using only ids from the Evidence IDs list in the context. Add a Mechanism paragraph (gene → enzyme function → drug activation/metabolism → clinical effect). If none exist, state: No variant evidence available in this file.`
        : /checklist/i.test(content)
        ? `${content}\n\nUse grounded items only, and cite at least one evidence id [rs…] when referencing genetics. Include a brief Mechanism line for top‑risk drugs.`
        : /explain/i.test(content)
        ? `${content}\n\nCite evidence ids in brackets using only those present in context. Include a Mechanism line.`
        : content;
    const userMsg: Msg = { role: "user", content: enforced };
    const next = [...messagesRef.current, userMsg];
    setMsgs(next);
    setInput("");
    if (!aiEnabled) {
      const fallback: Msg = {
        role: "assistant",
        content: "AI disabled — server not configured.\n\n" + `${context}\n\nEducational only. Not medical advice.`,
      };
      setMsgs((m) => [...m, fallback]);
      return;
    }
    try {
      setTyping(true);
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context, mode }),
      });
      const data = await r.json();
      const replyText = (data?.content ?? data?.message ?? data?.text ?? "").trim();
      const reply: Msg = { role: "assistant", content: replyText || "No response." };
      setMsgs((m) => [...m, reply]);
      if (focus.runId && /summary/i.test(enforced)) saveAIArtifact(focus.runId, "summary", reply.content);
      if (focus.runId && /checklist/i.test(enforced)) saveAIArtifact(focus.runId, "checklist", reply.content);
    } catch {
      const fallback: Msg = {
        role: "assistant",
        content: "AI disabled — server unreachable.\n\n" + `${context}\n\nEducational only. Not medical advice.`,
      };
      setMsgs((m) => [...m, fallback]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle>PharmaGuard Copilot</DialogTitle>
        </DialogHeader>
        {!aiEnabled && (
          <div className="text-xs mb-2 rounded border border-yellow-500/50 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 p-2">
            AI disabled — {aiError || "server not configured"}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Mode</span>
          <Button size="sm" variant={mode === "student" ? "secondary" : "outline"} onClick={() => setAndPersistMode("student")}>
            Student
          </Button>
          <Button size="sm" variant={mode === "clinician" ? "secondary" : "outline"} onClick={() => setAndPersistMode("clinician")}>
            Clinician
          </Button>
        </div>
        <div className="flex gap-2 py-2">
          {["Summarize this run", "Generate Next‑Step Checklist", "Explain CODEINE risk and phenotype", "What does IM phenotype mean for CYP2D6?"].map((p) => (
            <Badge key={p} className="cursor-pointer" onClick={() => void sendMessage(p)}>{p}</Badge>
          ))}
        </div>
        <ScrollArea className="h-72 border rounded p-3 bg-background/60">
          <div className="space-y-3 text-sm">
            {msgs.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <div className={m.role === "assistant" ? "text-foreground" : "text-primary"}>
                  <div className="font-medium">{m.role === "assistant" ? "Copilot" : "You"}</div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </motion.div>
            ))}
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-foreground">
                  <div className="font-medium">Copilot</div>
                  <div className="inline-flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
                    <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:150ms]" />
                    <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input placeholder="Ask about this run…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void sendMessage()} />
          <Button onClick={() => void sendMessage()}>Send</Button>
        </div>
        <div className="text-xs text-muted-foreground">Educational only. Not medical advice.</div>
      </DialogContent>
    </Dialog>
  );
}
