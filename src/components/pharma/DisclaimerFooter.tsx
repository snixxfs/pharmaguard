import { AlertTriangle } from "lucide-react";

export function DisclaimerFooter() {
  return (
    <footer className="border-t bg-muted/50 py-6 px-4 mt-12">
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-start gap-3 text-xs text-muted-foreground">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Disclaimer: Not Medical Advice</p>
            <p className="leading-relaxed">
              PharmaGuard is an educational pharmacogenomic analysis tool. Results are for informational and research purposes only
              and should NOT be used for clinical decision-making. Always consult a qualified healthcare professional and certified
              pharmacogenomics laboratory for medical decisions. This tool does not replace professional genetic counseling,
              clinical pharmacogenomic testing, or medical judgment.
            </p>
            <p>
              CPIC guidelines referenced are subject to updates. Visit{" "}
              <a href="https://cpicpgx.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                cpicpgx.org
              </a>{" "}
              for the latest clinical guidelines.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
