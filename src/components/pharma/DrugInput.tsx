import { useState } from "react";
import { Pill, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SUPPORTED_DRUGS } from "@/constants/pharmacogenomics";
import type { SupportedDrug } from "@/types/pharma";

interface DrugInputProps {
  selectedDrugs: SupportedDrug[];
  onDrugsChange: (drugs: SupportedDrug[]) => void;
}

export function DrugInput({ selectedDrugs, onDrugsChange }: DrugInputProps) {
  const [textInput, setTextInput] = useState("");

  const toggleDrug = (drug: SupportedDrug) => {
    if (selectedDrugs.includes(drug)) {
      onDrugsChange(selectedDrugs.filter(d => d !== drug));
    } else {
      onDrugsChange([...selectedDrugs, drug]);
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    const parts = textInput.split(",").map(s => s.trim().toUpperCase());
    const valid = parts.filter(p =>
      SUPPORTED_DRUGS.includes(p as SupportedDrug)
    ) as SupportedDrug[];
    const newDrugs = [...new Set([...selectedDrugs, ...valid])];
    onDrugsChange(newDrugs);
    setTextInput("");
  };

  return (
    <Card className="card-shadow hover:card-shadow-hover transition-shadow duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Select Drugs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_DRUGS.map(drug => (
            <Button
              key={drug}
              variant={selectedDrugs.includes(drug) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleDrug(drug)}
              className="text-xs"
            >
              {drug}
              {selectedDrugs.includes(drug) && (
                <X className="h-3 w-3 ml-1" />
              )}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Or type: CODEINE, WARFARIN..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
            className="text-sm"
          />
          <Button variant="outline" size="sm" onClick={handleTextSubmit}>
            Add
          </Button>
        </div>

        {selectedDrugs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedDrugs.map(drug => (
              <Badge key={drug} variant="secondary" className="text-xs">
                {drug}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
