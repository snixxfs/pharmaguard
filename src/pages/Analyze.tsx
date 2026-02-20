import { useCallback, useMemo, useState, useEffect } from "react";
import { AppShell } from "@/layout/AppShell";
import { UploadCard } from "@/components/pharma/UploadCard";
import { InputFormatAccordion } from "@/components/pharma/InputFormatAccordion";
import { VCFBuilderDialog } from "@/components/pharma/VCFBuilderDialog";
import { DrugInput } from "@/components/pharma/DrugInput";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 import { Play, CheckCircle2, ClipboardList, Rocket, Sparkles, Dna, Pill, FileJson, Inbox } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { PageHero } from "@/components/ui/page";
import { parseVCF } from "@/lib/vcfParser";
import { validateVCF } from "@/lib/vcfValidate";
import { analyzeVariants } from "@/lib/analysisEngine";
import { useNavigate } from "react-router-dom";
import { useAnalysis, saveRun } from "@/state/AnalysisStore";
import { detectDrugsFromText } from "@/lib/drugDetect";
import { SUPPORTED_DRUGS } from "@/constants/pharmacogenomics";
import type { SupportedDrug } from "@/types/pharma";
import { zPharmaResults } from "@/schemas/pharma";
import { SAMPLE_VCF_CONTENT } from "@/lib/sampleVCF";
import { motion } from "framer-motion";

type Step = "upload" | "meds" | "review" | "run";

export default function AnalyzePage() {
  const { state, dispatch } = useAnalysis();
  const nav = useNavigate();
  const [activeStep, setActiveStep] = useState<Step>("upload");
  const [freeText, setFreeText] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [aiDisabledBanner, setAiDisabledBanner] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [candidates, setCandidates] = useState<{ supported: SupportedDrug[]; other: string[]; confidence?: number; rationale?: string }>({ supported: [], other: [] });
  const [editSelection, setEditSelection] = useState<SupportedDrug[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const health = useMemo(() => {
    const v = state.validation;
    if (!v) return null;
    return {
      variantCount: v.variantCount,
      genesDetected: v.genesDetected,
      vcf_parsing_success: v.valid,
      warnings: v.warnings,
    };
  }, [state.validation]);

  const onFileUpload = useCallback((file: File, content: string) => {
    const sizeBytes = file.size;
    const tooBig = sizeBytes > 5 * 1024 * 1024;
    if (tooBig) {
      const base = file.name.replace(/\.(vcf|txt)$/gi, "").replace(/[^a-zA-Z0-9]/g, "_");
      const patientId = `PATIENT_${base.toUpperCase().slice(0, 20)}`;
      const invalid = {
        valid: false,
        errors: ["File exceeds 5MB limit → compress or export a smaller VCF"],
        warnings: [],
        patientId,
        variantCount: 0,
        genesDetected: [],
      };
      dispatch({ type: "setVCF", fileName: file.name, fileSize: sizeBytes, validation: invalid, variants: [] });
      setActiveStep("upload");
      return;
    }
    const pre = validateVCF(content);
    if (!pre.ok) {
      const base = file.name.replace(/\.(vcf|txt)$/gi, "").replace(/[^a-zA-Z0-9]/g, "_");
      const patientId = `PATIENT_${base.toUpperCase().slice(0, 20)}`;
      const invalid = {
        valid: false,
        errors: pre.errors,
        warnings: pre.warnings,
        patientId,
        variantCount: pre.stats?.variantLines || 0,
        genesDetected: [],
      };
      dispatch({ type: "setVCF", fileName: file.name, fileSize: sizeBytes, validation: invalid, variants: [] });
      setActiveStep("upload");
      return;
    }
    const { validation, variants, fileSizeMb } = parseVCF(content, file.name, sizeBytes);
    // Merge pre-parse warnings (annotation counts) into parser warnings
    validation.warnings = Array.from(new Set([...(validation.warnings || []), ...(pre.warnings || [])]));
    dispatch({ type: "setVCF", fileName: file.name, fileSize: Math.round(fileSizeMb * 1024 * 1024), validation, variants });
    setActiveStep("meds");
  }, [dispatch]);

  const loadDemo = useCallback(() => {
    const content = SAMPLE_VCF_CONTENT;
    const file = new File([content], "sample_demo.vcf", { type: "text/plain" });
    onFileUpload(file, content);
    dispatch({ type: "setDrugs", drugs: ["CODEINE", "CLOPIDOGREL", "WARFARIN", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"] });
    setActiveStep("review");
  }, [onFileUpload, dispatch]);

  const detect = useCallback(async () => {
    setDetecting(true);
    setConfirmed(false);
    const hint = (() => {
      const genes = state.validation?.genesDetected?.join(", ") || "";
      const rsids = state.variants?.map((v) => v.rsid).filter(Boolean).slice(0, 12).join(", ");
      return [genes && `Genes: ${genes}`, rsids && `rsIDs: ${rsids}`].filter(Boolean).join(" | ");
    })();
    try {
      const r = await fetch("/api/ai/detect-meds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMedsText: freeText, resultsSummary: "", vcfText: hint }),
      });
      const data = await r.json();
      if (data?.ok === false) {
        setAiEnabled(false);
        const out = await detectDrugsFromText(freeText);
        const normalized = out.supported_drugs.map((d) => d.toUpperCase()).filter((d): d is SupportedDrug => (SUPPORTED_DRUGS as string[]).includes(d));
        const unique = Array.from(new Set(normalized));
        setCandidates({ supported: unique, other: out.other_drugs || [], confidence: out.confidence, rationale: out.notes || "Keyword match fallback." });
        setEditSelection(unique);
        setAiDisabledBanner(true);
      } else {
        const supported = (data?.supported_drugs || []).map((d: string) => d.toUpperCase()).filter((d: string): d is SupportedDrug => (SUPPORTED_DRUGS as string[]).includes(d));
        const unique = Array.from(new Set(supported));
        setCandidates({ supported: unique, other: data?.other_drugs || [], confidence: data?.confidence, rationale: data?.rationale });
        setEditSelection(unique);
        setAiDisabledBanner(false);
      }
    } catch {
      const out = await detectDrugsFromText(freeText);
      const normalized = out.supported_drugs.map((d) => d.toUpperCase()).filter((d): d is SupportedDrug => (SUPPORTED_DRUGS as string[]).includes(d));
      const unique = Array.from(new Set(normalized));
      setCandidates({ supported: unique, other: out.other_drugs || [], confidence: out.confidence, rationale: out.notes || "Keyword match fallback." });
      setEditSelection(unique);
      setAiDisabledBanner(true);
    } finally {
      setDetecting(false);
    }
  }, [freeText, state.validation, state.variants]);

  useEffect(() => {
    fetch("/api/ai/ping")
      .then((r) => r.json().catch(() => ({ ok: false })))
      .then((j) => setAiEnabled(!!j?.ok))
      .catch(() => setAiEnabled(false));
  }, []);

  const canRun = Boolean(state.validation?.valid) && state.selectedDrugs.length > 0 && (!state.autoDetect || confirmed);

  const run = useCallback(() => {
    if (!state.validation?.valid) return;
    const results = analyzeVariants(
      state.variants,
      state.selectedDrugs,
      state.validation.patientId,
      parseFloat((state.vcfFileSize / (1024 * 1024)).toFixed(3)),
    );
    const validated = zPharmaResults.safeParse(results);
    if (!validated.success) {
      alert("Result failed schema validation. Please re-check input.");
      return;
    }
    const runId = (globalThis.crypto && "randomUUID" in globalThis.crypto ? globalThis.crypto.randomUUID() : `${Date.now()}`);
    saveRun(runId, results, {
      patientId: state.validation.patientId,
      genes: state.validation.genesDetected,
    });
    dispatch({ type: "setResults", results });
    nav(`/results/${runId}`);
  }, [dispatch, nav, state]);

  const stepIndex = ["upload", "meds", "review", "run"].indexOf(activeStep);

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(6px)" }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="space-y-4">
        <PageHero
          className="pg-hero-sheen card-3d [&_h1]:text-slate-900 [&_p]:text-slate-700"
          title="Analyze"
          subtitle="Upload a VCF, select medications, and generate CPIC‑aligned recommendations."
        >
          <div className="mt-1 mb-1">
            <div className="h-[3px] w-16 rounded-full bg-gradient-to-r from-[hsl(var(--pg-teal))] to-[hsl(var(--pg-violet))]" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded border pg-border-soft">VCF v4.2</span>
            <span className="text-[11px] px-2 py-0.5 rounded border pg-border-soft">CPIC aligned</span>
            <span className="text-[11px] px-2 py-0.5 rounded border pg-border-soft">Schema safe</span>
          </div>
        </PageHero>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="space-y-4 lg:col-span-8">
            <Surface depth="raised" className="sticky top-16 z-10 p-2 bg-background/70 backdrop-blur card-3d">
              <Tabs value={activeStep} onValueChange={(v) => setActiveStep(v as Step)}>
                <TabsList className="mb-2 rounded-full pg-border-soft bg-background/80 backdrop-blur px-1.5 py-1 shadow-pgSoft">
                  <TabsTrigger value="upload" className="rounded-full px-3 py-1.5 text-sm transition-all data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--pg-teal))] data-[state=active]:via-[hsl(var(--pg-cyan))] data-[state=active]:to-[hsl(var(--pg-violet))] data-[state=active]:shadow data-[state=active]:border data-[state=active]:border-[hsl(var(--pg-teal)/0.4)]">
                    <ClipboardList className="h-4 w-4 mr-1" /> Upload
                  </TabsTrigger>
                  <TabsTrigger value="meds" className="rounded-full px-3 py-1.5 text-sm transition-all data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--pg-teal))] data-[state=active]:via-[hsl(var(--pg-cyan))] data-[state=active]:to-[hsl(var(--pg-violet))] data-[state=active]:shadow data-[state=active]:border data-[state=active]:border-[hsl(var(--pg-teal)/0.4)]">
                    Medications
                  </TabsTrigger>
                  <TabsTrigger value="review" className="rounded-full px-3 py-1.5 text-sm transition-all data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--pg-teal))] data-[state=active]:via-[hsl(var(--pg-cyan))] data-[state=active]:to-[hsl(var(--pg-violet))] data-[state=active]:shadow data-[state=active]:border data-[state=active]:border-[hsl(var(--pg-teal)/0.4)]">
                    Review
                  </TabsTrigger>
                  <TabsTrigger value="run" className="rounded-full px-3 py-1.5 text-sm transition-all data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--pg-teal))] data-[state=active]:via-[hsl(var(--pg-cyan))] data-[state=active]:to-[hsl(var(--pg-violet))] data-[state=active]:shadow data-[state=active]:border data-[state=active]:border-[hsl(var(--pg-teal)/0.4)]">
                    <Rocket className="h-4 w-4 mr-1" /> Run
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={false}
                  animate={{ width: `${((stepIndex + 1) / 4) * 100}%` }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </Surface>

            <Tabs value={activeStep} onValueChange={(v) => setActiveStep(v as Step)}>

              <TabsContent value="upload">
                <Surface
                  depth="raised"
                  className={`glass-card card-3d dash-animated p-4 transition-transform duration-200 hover:-translate-y-0.5 ${dragOver ? "ring-2 ring-[hsl(var(--pg-cyan)/0.6)]" : ""}`}
                  onDragEnter={() => setDragOver(true)}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                >
                  <div className="pb-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Inbox className="h-5 w-5 text-primary" />
                      Upload
                      <span className="ml-2 text-[11px] px-2 py-0.5 rounded border bg-muted">Max 5MB</span>
                    </div>
                  </div>
                  <div className="pt-0">
                    <div className="text-xs text-slate-700 mb-2">Drop a VCF file here or use the builder</div>
                    <UploadCard onFileUpload={onFileUpload} validation={state.validation} fileName={state.vcfFileName} />
                    <div className="mt-2 flex gap-2">
                      <VCFBuilderDialog onLoadIntoAnalyzer={(fn, content) => onFileUpload(new File([content], fn), content)} />
                      <Button size="sm" variant="secondary" onClick={loadDemo}>Demo data</Button>
                    </div>
                    <div className="mt-3 text-xs flex flex-wrap items-center gap-2 text-slate-600">
                      <span>File:</span>
                      <span className="px-2 py-0.5 rounded border">{state.vcfFileName || "—"}</span>
                      <span>Size:</span>
                      <span className="px-2 py-0.5 rounded border">
                        {state.vcfFileSize ? `${(state.vcfFileSize / (1024 * 1024)).toFixed(2)} MB` : "—"}
                      </span>
                      <span>Format:</span>
                      <span className="px-2 py-0.5 rounded border">{state.vcfFileName?.split(".").pop()?.toUpperCase() || "VCF"}</span>
                    </div>
                    {state.vcfFileSize ? (
                      <div className="mt-2">
                        <div className="text-[10px] mb-1 text-slate-600">Max 5MB</div>
                        <div className="h-1.5 w-full rounded bg-muted overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[hsl(var(--brand-teal))] to-[hsl(var(--brand-cyan))]"
                            initial={false}
                            animate={{ width: `${Math.min(1, state.vcfFileSize / (5 * 1024 * 1024)) * 100}%` }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Surface>
              </TabsContent>

              <TabsContent value="meds">
                <Surface depth="raised" className="card-3d p-4 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="pb-2">
                    <div className="text-sm font-medium">Medications</div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={state.autoDetect} onCheckedChange={(v) => dispatch({ type: "setAutoDetect", enabled: v })} id="auto" />
                      <Label htmlFor="auto" className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Auto-detect drugs (AI)</Label>
                    </div>
                    {state.autoDetect ? (
                      <>
                        <Textarea value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="Paste medication list or notes..." />
                        <div className="flex gap-2">
                          <Button onClick={detect} disabled={detecting}>{detecting ? "Detecting..." : "Detect & Map"}</Button>
                          <Button variant="outline" onClick={() => dispatch({ type: "setDrugs", drugs: [] })}>Clear</Button>
                        </div>
                        {aiDisabledBanner && (
                          <div className="text-xs rounded p-2 border border-yellow-500/50 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300">
                            AI disabled — server not configured
                          </div>
                        )}
                        {candidates.supported.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-medium">Suggested medications</div>
                            <div className="flex flex-wrap gap-1">
                              {SUPPORTED_DRUGS.map((d) => (
                                <button
                                  key={d}
                                  onClick={() =>
                                    setEditSelection((sel) =>
                                      sel.includes(d) ? sel.filter((x) => x !== d) : [...sel, d],
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded-full border text-xs ${
                                    editSelection.includes(d) ? "bg-secondary text-secondary-foreground" : "hover:bg-[hsl(var(--pg-teal)/0.08)]"
                                  }`}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                            <div className="text-xs text-slate-700">
                              {typeof candidates.confidence === "number" && (
                                <span className="mr-2">Confidence: {(candidates.confidence * 100).toFixed(0)}%</span>
                              )}
                              {candidates.rationale && <span>Rationale: {candidates.rationale}</span>}
                            </div>
                            {candidates.other.length > 0 && (
                              <div className="text-xs text-slate-700">
                                Other mentioned: {candidates.other.join(", ")}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const unique = Array.from(new Set(editSelection));
                                  dispatch({ type: "setDrugs", drugs: unique });
                                  setConfirmed(true);
                                }}
                              >
                                Apply Selection
                              </Button>
                              {confirmed ? (
                                <span className="text-xs text-safe">Confirmed</span>
                              ) : (
                                <span className="text-xs text-slate-600">Confirm before running</span>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <DrugInput selectedDrugs={state.selectedDrugs} onDrugsChange={(d) => dispatch({ type: "setDrugs", drugs: d })} />
                    )}
                  </div>
                </Surface>
              </TabsContent>

              <TabsContent value="review">
                <Surface depth="raised" className="card-3d p-4 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="pb-2">
                    <div className="text-sm font-medium">Review</div>
                  </div>
                  <div className="space-y-3">
                    {state.validation && (
                      <div className="text-sm">
                        <div className="font-medium">Patient: <span className="font-mono">{state.validation.patientId}</span></div>
                        <div className="text-slate-600 text-xs">Genes: {state.validation.genesDetected.join(", ") || "None"}</div>
                      </div>
                    )}
                    <div className="text-sm">
                      <div className="font-medium">Selected drugs</div>
                      <div className="text-slate-700">{state.selectedDrugs.join(", ") || "None"}</div>
                    </div>
                    <Alert>
                      <AlertTitle>Ready to run</AlertTitle>
                      <AlertDescription className="text-xs">
                        Deterministic engine will analyze your VCF for the selected medications.
                        {state.autoDetect && !confirmed && " Please confirm AI-detected selection before running."}
                      </AlertDescription>
                    </Alert>
                  </div>
                </Surface>
              </TabsContent>

              <TabsContent value="run">
                <Surface depth="raised" className="card-3d flex items-center gap-3 sticky bottom-0 p-2">
                  <Button onClick={run} disabled={!canRun}><Play className="h-4 w-4 mr-1" /> Run Analysis</Button>
                  {canRun ? <span className="text-sm text-safe flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Ready</span> : <span className="text-sm text-muted-foreground">Complete previous steps</span>}
                </Surface>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-16 space-y-4">
            <Surface depth="raised" className="glass-card card-3d p-4">
              <div className="pb-2 text-sm font-medium relative after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-12 after:bg-gradient-to-r after:from-[hsl(var(--pg-teal))] after:to-[hsl(var(--pg-violet))]">Live Insights</div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold mb-1">What you’ll get</div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2"><FileJson className="h-4 w-4 text-primary" /> Schema‑compliant JSON</div>
                    <div className="flex items-center gap-2"><Dna className="h-4 w-4 text-primary" /> Evidence‑based phenotype mapping</div>
                    <div className="flex items-center gap-2"><Pill className="h-4 w-4 text-primary" /> CPIC‑aligned recommendations</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1">Coverage preview</div>
                  <div className="flex flex-wrap gap-1">
                    {["CYP2D6","CYP2C19","CYP2C9","SLCO1B1","TPMT","DPYD"].map(g => {
                      const found = !!health?.genesDetected.includes(g);
                      return (
                        <span
                          key={g}
                          className={`chip ${found ? "chip-active" : ""}`}
                          title={found ? "Found" : "Unknown"}
                        >
                          {g}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1">Supported drugs</div>
                  <div className="flex flex-wrap gap-1">
                    {SUPPORTED_DRUGS.map(d => <span key={d} className="chip">{d}</span>)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1">VCF Health Check</div>
                  <div className="text-sm space-y-2">
                    {health ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 text-xs">Variants</span>
                          <span className="font-medium">{health.variantCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 text-xs">Gene coverage</span>
                          <span>{health.genesDetected.length}/6</span>
                        </div>
                        <div className="text-xs text-slate-600">Parsing: {health.vcf_parsing_success ? "Success" : "Failed"}</div>
                        {health.warnings.length > 0 && (
                          <Alert>
                            <AlertTitle>Warnings</AlertTitle>
                            <AlertDescription className="text-xs">{health.warnings.join(" • ")}</AlertDescription>
                          </Alert>
                        )}
                      </>
                    ) : (
                      <div className="text-slate-600 text-sm">Upload a VCF to start.</div>
                    )}
                    <InputFormatAccordion />
                    <Button size="sm" variant="secondary" onClick={loadDemo} className="w-full mt-1">Load Demo Data</Button>
                  </div>
                </div>
              </div>
            </Surface>
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
