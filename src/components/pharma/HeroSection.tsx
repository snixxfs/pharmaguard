import { motion } from "framer-motion";
import { Shield, Dna, FileJson, Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const chips = [
  { label: "VCF v4.2", icon: FileJson },
  { label: "6 genes", icon: Dna },
  { label: "6 drugs", icon: Pill },
  { label: "JSON schema compliant", icon: Shield },
];

export function HeroSection() {
  return (
    <section className="hero-gradient py-16 px-4 md:py-24">
      <div className="container max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-10 w-10 text-primary-foreground/90" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display text-primary-foreground tracking-tight">
              PharmaGuard
            </h1>
          </div>
          <p className="text-lg md:text-xl text-primary-foreground/85 max-w-2xl mx-auto mb-8 leading-relaxed">
            Pharmacogenomic risk prediction + CPIC-aligned recommendations with explainable evidence.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {chips.map((chip) => (
              <Badge
                key={chip.label}
                variant="secondary"
                className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 backdrop-blur-sm px-3 py-1.5 text-sm font-medium"
              >
                <chip.icon className="h-3.5 w-3.5 mr-1.5" />
                {chip.label}
              </Badge>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
