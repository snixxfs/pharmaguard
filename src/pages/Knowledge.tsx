import { useMemo, useState } from "react";
import { AppShell } from "@/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GENE_INFO, DRUG_INFO } from "@/data/knowledge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Search } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { PageHero } from "@/components/ui/page";
import Searchbar from "@/components/ui/searchbar";

export default function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"genes" | "drugs">("genes");
  const genes = useMemo(() => Object.entries(GENE_INFO), []);
  const drugs = useMemo(() => Object.entries(DRUG_INFO), []);
  const q = query.toLowerCase();
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<{ kind: "gene" | "drug"; id: string } | null>(null);

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(6px)" }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="space-y-4">
        <PageHero className="pg-hero-sheen card-3d" title="Knowledge" subtitle="Quick pharmacogenomics reference for supported genes and drugs." />
        <Surface depth="raised" className="p-3 glass-card">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Searchbar className="glass-card" value={query} onChange={(e) => setQuery((e.target as HTMLInputElement).value)} placeholder="Search genes or drugs…" />
            </div>
            <Button variant="secondary" onClick={() => setQuery("")}>Clear</Button>
          </div>
        </Surface>

        <div className="flex flex-wrap gap-2">
          <div className="text-xs text-muted-foreground">Quick links</div>
          <div className="flex flex-wrap gap-1">
            {["CYP2D6","CYP2C19","CYP2C9","SLCO1B1","TPMT","DPYD"].map(g => (
              <button key={g} onClick={() => { setTab("genes"); setQuery(g); }} className="px-2 py-0.5 rounded border text-[11px] hover:bg-muted">{g}</button>
            ))}
            {["CODEINE","CLOPIDOGREL","WARFARIN","SIMVASTATIN","AZATHIOPRINE","FLUOROURACIL"].map(d => (
              <button key={d} onClick={() => { setTab("drugs"); setQuery(d); }} className="px-2 py-0.5 rounded border text-[11px] hover:bg-muted">{d}</button>
            ))}
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "genes" | "drugs")}>
          <TabsList className="relative rounded-full pg-border-soft bg-background/70 backdrop-blur px-1.5 py-1 shadow-pgSoft">
            <TabsTrigger className="relative rounded-full px-3 py-1.5 text-sm data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 transition-all" value="genes">
              Genes
              {tab === "genes" && <motion.div layoutId="kTabsIndicator" className="absolute left-2 right-2 -bottom-1 h-0.5 bg-primary" />}
            </TabsTrigger>
            <TabsTrigger className="relative rounded-full px-3 py-1.5 text-sm data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 transition-all" value="drugs">
              Drugs
              {tab === "drugs" && <motion.div layoutId="kTabsIndicator" className="absolute left-2 right-2 -bottom-1 h-0.5 bg-primary" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="genes">
            <motion.div className="grid md:grid-cols-2 gap-4 lg:gap-5" initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, ease: [0.16, 1, 0.3, 1] } } }}>
              {genes
                .filter(([g]) => g.toLowerCase().includes(q))
                .map(([gene, info]) => (
                  <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } }}>
                  <Surface
                    key={gene}
                    depth="raised"
                    className="p-4 glass-card card-3d hover:card-shadow-hover transition-transform hover:-translate-y-0.5 cursor-pointer"
                    onClick={() => { setFocus({ kind: "gene", id: gene }); setOpen(true); }}
                  >
                    <div className="pb-2 text-sm font-medium">{gene}</div>
                    <div className="text-sm space-y-2">
                      <p className="text-muted-foreground">{info.about}</p>
                      <div>
                        <div className="text-xs font-medium">Phenotype meanings</div>
                        <ul className="text-xs list-disc pl-5">{info.phenotypes.map((p) => <li key={p}>{p}</li>)}</ul>
                      </div>
                      <div>
                        <div className="text-xs font-medium mb-1">Related drugs</div>
                        <div className="flex flex-wrap gap-1">
                          {info.drugs.map((d) => (
                            <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium">Evidence chain (example)</div>
                        <ul className="text-xs list-disc pl-5">{info.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
                      </div>
                      <div className="pt-2">
                        <Link className="text-xs underline text-primary" to="/analyze">Analyze a VCF</Link>
                      </div>
                    </div>
                  </Surface>
                  </motion.div>
                ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="drugs">
            <motion.div className="grid md:grid-cols-2 gap-4 lg:gap-5" initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, ease: [0.16, 1, 0.3, 1] } } }}>
              {drugs
                .filter(([d]) => d.toLowerCase().includes(q))
                .map(([drug, info]) => (
                  <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } }}>
                  <Surface
                    key={drug}
                    depth="raised"
                    className="p-4 glass-card card-3d hover:card-shadow-hover transition-transform hover:-translate-y-0.5 cursor-pointer"
                    onClick={() => { setFocus({ kind: "drug", id: drug }); setOpen(true); }}
                  >
                    <div className="pb-2 text-sm font-medium">{drug}</div>
                    <div className="text-sm space-y-2">
                      <div className="text-xs"><span className="font-medium">Primary genes: </span>{info.primaryGenes.join(", ")}</div>
                      <div>
                        <div className="text-xs font-medium mb-1">What to do</div>
                        <ul className="text-xs list-disc pl-5">{info.actions.map((a) => <li key={a}>{a}</li>)}</ul>
                      </div>
                      <div>
                        <div className="text-xs font-medium mb-1">Sample evidence (static)</div>
                        <div className="text-xs grid gap-1">
                          {info.sampleEvidence.map((e) => (
                            <div key={e.rsid + e.note} className="rounded border p-2 flex flex-wrap gap-3">
                              <span className="font-mono">{e.rsid}</span>
                              <span>{e.gene} {e.star}</span>
                              <span className="text-muted-foreground">{e.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2">
                        <Link className="text-xs underline text-primary" to="/analyze">Run analysis</Link>
                      </div>
                    </div>
                  </Surface>
                  </motion.div>
                ))}
            </motion.div>
          </TabsContent>
        </Tabs>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                {focus?.kind === "gene" ? focus.id : focus?.id}
              </DrawerTitle>
            </DrawerHeader>
            <div className="p-4 text-sm space-y-2">
              {focus?.kind === "gene" && (() => {
                const info = GENE_INFO[focus.id as keyof typeof GENE_INFO];
                if (!info) return <div className="text-muted-foreground">No info available.</div>;
                return (
                  <>
                    <div className="text-muted-foreground">{info.about}</div>
                    <div>
                      <div className="text-xs font-medium">Phenotypes</div>
                      <ul className="text-xs list-disc pl-5">{info.phenotypes.map((p) => <li key={p}>{p}</li>)}</ul>
                    </div>
                    <div>
                      <div className="text-xs font-medium">Related drugs</div>
                      <div className="flex flex-wrap gap-1">{info.drugs.map(d => <Badge key={d} variant="outline" className="text-xs">{d}</Badge>)}</div>
                    </div>
                    <div className="pt-2">
                      <Link className="text-xs underline text-primary" to="/analyze">Analyze a VCF</Link>
                    </div>
                  </>
                );
              })()}
              {focus?.kind === "drug" && (() => {
                const info = DRUG_INFO[focus.id.toUpperCase() as keyof typeof DRUG_INFO];
                if (!info) return <div className="text-muted-foreground">No info available.</div>;
                return (
                  <>
                    <div className="text-xs"><span className="font-medium">Primary genes: </span>{info.primaryGenes.join(", ")}</div>
                    <div>
                      <div className="text-xs font-medium">What to do</div>
                      <ul className="text-xs list-disc pl-5">{info.actions.map((a) => <li key={a}>{a}</li>)}</ul>
                    </div>
                    <div>
                      <div className="text-xs font-medium">Sample evidence (static)</div>
                      <div className="text-xs grid gap-1">
                        {info.sampleEvidence.map((e) => (
                          <div key={e.rsid + e.note} className="rounded border p-2 flex flex-wrap gap-3">
                            <span className="font-mono">{e.rsid}</span>
                            <span>{e.gene} {e.star}</span>
                            <span className="text-muted-foreground">{e.note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2">
                      <Link className="text-xs underline text-primary" to="/analyze">Run analysis</Link>
                    </div>
                  </>
                );
              })()}
            </div>
          </DrawerContent>
        </Drawer>
      </motion.div>
    </AppShell>
  );
}
