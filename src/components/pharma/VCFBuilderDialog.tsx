import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wrench, Download, Upload, Plus, X } from "lucide-react";
import { SUPPORTED_GENES, AVAILABLE_VARIANTS, SAMPLE_PROFILES, type VCFBuilderVariant } from "@/constants/pharmacogenomics";
import { generateVCFContent } from "@/lib/vcfParser";
import type { SupportedGene } from "@/types/pharma";

interface VCFBuilderDialogProps {
  onLoadIntoAnalyzer: (fileName: string, content: string) => void;
}

export function VCFBuilderDialog({ onLoadIntoAnalyzer }: VCFBuilderDialogProps) {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("PATIENT_001");
  const [selectedVariants, setSelectedVariants] = useState<(VCFBuilderVariant & { genotypeOverride?: string })[]>([]);
  const [selectedGene, setSelectedGene] = useState<SupportedGene>("CYP2D6");

  const addVariant = (v: VCFBuilderVariant) => {
    if (selectedVariants.some(sv => sv.rs === v.rs)) return;
    setSelectedVariants(prev => [...prev, { ...v }]);
  };

  const removeVariant = (rs: string) => {
    setSelectedVariants(prev => prev.filter(v => v.rs !== rs));
  };

  const updateGenotype = (rs: string, gt: string) => {
    setSelectedVariants(prev =>
      prev.map(v => v.rs === rs ? { ...v, genotype: gt } : v)
    );
  };

  const loadProfile = (profile: typeof SAMPLE_PROFILES[0]) => {
    setPatientId(profile.patientId);
    setSelectedVariants(profile.variants.map(v => ({ ...v })));
  };

  const generate = () => {
    return generateVCFContent(patientId, selectedVariants);
  };

  const downloadFile = (ext: string) => {
    const content = generate();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${patientId}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadIntoAnalyzer = () => {
    const content = generate();
    onLoadIntoAnalyzer(`${patientId}.vcf`, content);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Wrench className="h-3 w-3 mr-1" /> VCF Builder
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">VCF Builder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sample Profiles */}
          <div>
            <Label className="text-xs text-muted-foreground">Quick Load Profiles</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SAMPLE_PROFILES.map(p => (
                <Button key={p.name} variant="outline" size="sm" className="text-xs" onClick={() => loadProfile(p)}>
                  {p.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Patient ID */}
          <div>
            <Label htmlFor="patient-id" className="text-xs">Patient ID</Label>
            <Input id="patient-id" value={patientId} onChange={e => setPatientId(e.target.value)} className="mt-1" />
          </div>

          {/* Gene selector + variant picker */}
          <div>
            <Label className="text-xs">Add Variants</Label>
            <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
              {SUPPORTED_GENES.map(g => (
                <Button
                  key={g}
                  variant={selectedGene === g ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedGene(g)}
                >
                  {g}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-1">
              {AVAILABLE_VARIANTS[selectedGene]?.map(v => (
                <div key={v.rs} className="flex items-center justify-between py-1 px-2 rounded bg-muted text-xs">
                  <span className="font-mono">{v.gene} {v.star} ({v.rs})</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => addVariant(v)}
                    disabled={selectedVariants.some(sv => sv.rs === v.rs)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Variants */}
          {selectedVariants.length > 0 && (
            <div>
              <Label className="text-xs">Selected Variants ({selectedVariants.length})</Label>
              <div className="space-y-1 mt-1">
                {selectedVariants.map(v => (
                  <div key={v.rs} className="flex items-center gap-2 py-1.5 px-2 rounded border text-xs">
                    <span className="font-mono flex-1">{v.gene} {v.star} ({v.rs})</span>
                    <select
                      value={v.genotype}
                      onChange={e => updateGenotype(v.rs, e.target.value)}
                      className="text-xs bg-muted rounded px-1.5 py-0.5 border-none"
                    >
                      <option value="0/1">0/1 (Het)</option>
                      <option value="1/1">1/1 (Hom Alt)</option>
                      <option value="0/0">0/0 (Hom Ref)</option>
                    </select>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeVariant(v.rs)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button size="sm" className="text-xs" onClick={() => downloadFile("vcf")} disabled={selectedVariants.length === 0}>
              <Download className="h-3 w-3 mr-1" /> Download .vcf
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => downloadFile("vsf")} disabled={selectedVariants.length === 0}>
              <Download className="h-3 w-3 mr-1" /> Download .vsf
            </Button>
            <Button size="sm" variant="secondary" className="text-xs" onClick={loadIntoAnalyzer} disabled={selectedVariants.length === 0}>
              <Upload className="h-3 w-3 mr-1" /> Load into Analyzer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
