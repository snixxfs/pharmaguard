import { useState, useCallback } from "react";
import { HeroSection } from "@/components/pharma/HeroSection";
import { UploadCard } from "@/components/pharma/UploadCard";
import { DrugInput } from "@/components/pharma/DrugInput";
import { ResultsSection } from "@/components/pharma/ResultsSection";
import { VCFBuilderDialog } from "@/components/pharma/VCFBuilderDialog";
import { InputFormatAccordion } from "@/components/pharma/InputFormatAccordion";
import { DisclaimerFooter } from "@/components/pharma/DisclaimerFooter";
import { Button } from "@/components/ui/button";
import { parseVCF } from "@/lib/vcfParser";
import { analyzeVariants } from "@/lib/analysisEngine";
import { toast } from "sonner";
import { Play, Download, FileDown, Loader2 } from "lucide-react";
import type { SupportedDrug, VCFValidation, ParsedVariant, PharmaResult } from "@/types/pharma";

// Sample VCF for quick demo
const SAMPLE_VCF = `##fileformat=VCFv4.2
##fileDate=20260219
##source=PharmaGuard_Sample
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene symbol">
##INFO=<ID=STAR,Number=.,Type=String,Description="Star allele designation">
##INFO=<ID=RS,Number=1,Type=String,Description="dbSNP ID">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tPATIENT_DEMO
chr22\t42128945\trs3892097\tC\tT\t100\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs3892097\tGT\t0/1
chr22\t42126611\trs16947\tG\tA\t100\tPASS\tGENE=CYP2D6;STAR=*2;RS=rs16947\tGT\t0/1
chr10\t96541616\trs4244285\tG\tA\t100\tPASS\tGENE=CYP2C19;STAR=*2;RS=rs4244285\tGT\t1/1
chr10\t96522463\trs12248560\tC\tT\t100\tPASS\tGENE=CYP2C19;STAR=*17;RS=rs12248560\tGT\t0/1
chr10\t96702047\trs1799853\tC\tT\t100\tPASS\tGENE=CYP2C9;STAR=*2;RS=rs1799853\tGT\t0/1
chr12\t21331549\trs4149056\tT\tC\t100\tPASS\tGENE=SLCO1B1;STAR=*5;RS=rs4149056\tGT\t0/1
chr6\t18139228\trs1142345\tA\tG\t100\tPASS\tGENE=TPMT;STAR=*3C;RS=rs1142345\tGT\t0/1
chr1\t97915614\trs3918290\tC\tT\t100\tPASS\tGENE=DPYD;STAR=*2A;RS=rs3918290\tGT\t0/1`;

const Index = () => {
  const [vcfContent, setVcfContent] = useState<string>("");
  const [vcfFileName, setVcfFileName] = useState("");
  const [vcfFileSize, setVcfFileSize] = useState(0);
  const [validation, setValidation] = useState<VCFValidation | null>(null);
  const [parsedVariants, setParsedVariants] = useState<ParsedVariant[]>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<SupportedDrug[]>([]);
  const [results, setResults] = useState<PharmaResult[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const processVCF = useCallback((fileName: string, content: string, fileSize?: number) => {
    const size = fileSize ?? new Blob([content]).size;
    setVcfFileName(fileName);
    setVcfContent(content);
    setVcfFileSize(size);
    setResults(null);

    const result = parseVCF(content, fileName, size);
    setValidation(result.validation);
    setParsedVariants(result.variants);

    if (!result.validation.valid) {
      toast.error("VCF validation failed. Check errors above.");
    } else {
      toast.success(`Parsed ${result.variants.length} variants from ${fileName}`);
    }
  }, []);

  const handleFileUpload = useCallback((file: File, content: string) => {
    processVCF(file.name, content, file.size);
  }, [processVCF]);

  const loadSample = useCallback(() => {
    processVCF("sample_demo.vcf", SAMPLE_VCF);
    setSelectedDrugs(["CODEINE", "CLOPIDOGREL", "WARFARIN", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"]);
  }, [processVCF]);

  const downloadSampleVCF = useCallback(() => {
    const blob = new Blob([SAMPLE_VCF], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_demo.vcf";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleBuilderLoad = useCallback((fileName: string, content: string) => {
    processVCF(fileName, content);
  }, [processVCF]);

  const analyze = useCallback(() => {
    if (!validation?.valid || selectedDrugs.length === 0) return;
    setIsAnalyzing(true);
    const start = performance.now();

    // Use setTimeout to keep UI responsive
    setTimeout(() => {
      try {
        const fileSizeMb = parseFloat((vcfFileSize / (1024 * 1024)).toFixed(3));
        const analysisResults = analyzeVariants(parsedVariants, selectedDrugs, validation.patientId, fileSizeMb);
        setResults(analysisResults);
        setElapsed(Math.round(performance.now() - start));
        toast.success(`Analysis complete for ${selectedDrugs.length} drug(s)`);
      } catch (err) {
        toast.error("Analysis failed: " + (err instanceof Error ? err.message : "Unknown error"));
      } finally {
        setIsAnalyzing(false);
      }
    }, 50);
  }, [validation, selectedDrugs, parsedVariants, vcfFileSize]);

  const canAnalyze = validation?.valid && selectedDrugs.length > 0 && !isAnalyzing;

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Input Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <UploadCard onFileUpload={handleFileUpload} validation={validation} fileName={vcfFileName} />
          <DrugInput selectedDrugs={selectedDrugs} onDrugsChange={setSelectedDrugs} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={analyze} disabled={!canAnalyze} className="text-sm">
            {isAnalyzing ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Analyzing...</>
            ) : (
              <><Play className="h-4 w-4 mr-1.5" /> Analyze</>
            )}
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={loadSample}>
            <FileDown className="h-3 w-3 mr-1" /> Load Sample VCF
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={downloadSampleVCF}>
            <Download className="h-3 w-3 mr-1" /> Download Sample VCF
          </Button>
          <VCFBuilderDialog onLoadIntoAnalyzer={handleBuilderLoad} />
        </div>

        {/* Input Format Reference */}
        <InputFormatAccordion />

        {/* Results */}
        {results && <ResultsSection results={results} elapsed={elapsed} />}
      </main>

      <DisclaimerFooter />
    </div>
  );
};

export default Index;
