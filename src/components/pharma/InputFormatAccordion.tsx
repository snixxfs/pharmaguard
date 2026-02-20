import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText } from "lucide-react";

export function InputFormatAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="format" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-medium">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Input Format Reference
          </span>
        </AccordionTrigger>
        <AccordionContent className="text-xs space-y-3 pb-4">
          <div>
            <p className="font-semibold mb-1">Example VCF Line:</p>
            <pre className="bg-muted rounded p-2 overflow-x-auto font-mono text-[10px] leading-relaxed">
{`chr22\t42128945\trs3892097\tC\tT\t100\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs3892097\tGT\t0/1`}
            </pre>
          </div>
          <div>
            <p className="font-semibold mb-1">Required INFO Tags:</p>
            <ul className="space-y-0.5 text-muted-foreground">
              <li><code className="font-mono text-foreground">GENE</code> — Gene symbol (e.g., CYP2D6)</li>
              <li><code className="font-mono text-foreground">STAR</code> — Star allele (e.g., *4, *2A)</li>
              <li><code className="font-mono text-foreground">RS</code> — dbSNP rsID (e.g., rs3892097)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">Supported Genes:</p>
            <p className="font-mono text-muted-foreground">CYP2D6 · CYP2C19 · CYP2C9 · SLCO1B1 · TPMT · DPYD</p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
