import { useCallback, useRef, useState } from "react";
import { Upload, FileCheck, AlertCircle, File, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VCFValidation } from "@/types/pharma";

interface UploadCardProps {
  onFileUpload: (file: File, content: string) => void;
  validation: VCFValidation | null;
  fileName: string;
}

export function UploadCard({ onFileUpload, validation, fileName }: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sizeBytes, setSizeBytes] = useState<number>(0);

  const handleFile = useCallback((file: File) => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".vcf") && !ext.endsWith(".vcf.txt")) {
      // still allow read to show validator errors in UI
    }
    setSizeBytes(file.size);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileUpload(file, content);
    };
    reader.readAsText(file);
  }, [onFileUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  return (
    <Card className="card-shadow hover:card-shadow-hover transition-shadow duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload VCF File
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".vcf,.txt"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Drag & drop or click to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            VCF v4.2 format • Max 5MB {sizeBytes > 0 && <span className={sizeBytes > 5*1024*1024 ? "text-danger font-medium" : ""}>• Selected: {sizeBytes >= 1024*1024 ? (sizeBytes / (1024*1024)).toFixed(2) + " MB" : Math.ceil(sizeBytes/1024) + " KB"}</span>}
          </p>
        </div>

        {validation && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <File className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium truncate">{fileName}</span>
            </div>

            {!validation.valid ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <div className="flex items-center gap-2 font-medium text-destructive mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>VCF can’t be processed</span>
                </div>
                <div className="space-y-1">
                  {validation.errors.map((err, i) => (
                    <div key={i} className="text-sm text-destructive">{err}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-safe">
                <FileCheck className="h-4 w-4" />
                <span>Valid VCF — {validation.variantCount} variants</span>
              </div>
            )}

            {validation.valid && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Patient ID: <span className="font-mono font-medium text-foreground">{validation.patientId}</span></p>
                <p>Genes detected: {validation.genesDetected.length > 0 ? validation.genesDetected.join(", ") : "None (supported)"}</p>
              </div>
            )}

            {validation.valid && validation.warnings.length > 0 && (
              <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-2 text-xs flex items-start gap-2">
                <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800 dark:text-yellow-300">Some annotations missing; results may be Unknown.</div>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {validation.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
