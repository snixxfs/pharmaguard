export const GENE_INFO: Record<string, { about: string; phenotypes: string[]; drugs: string[]; evidence: string[] }> = {
  CYP2D6: {
    about: "CYP2D6 metabolizes many opioids and antidepressants. Function varies widely due to gene duplications and star alleles.",
    phenotypes: ["PM (Poor) – markedly reduced function", "IM (Intermediate) – reduced function", "NM (Normal) – typical function", "URM (Ultra-rapid) – increased function"],
    drugs: ["CODEINE"],
    evidence: ["rs3892097 → *4 → Loss-of-function → Codeine toxicity/ineffectiveness risk"],
  },
  CYP2C19: {
    about: "CYP2C19 activates prodrugs such as clopidogrel and metabolizes PPIs and antidepressants.",
    phenotypes: ["PM – little to no function", "IM – reduced", "NM – normal", "RM/UM – increased function"],
    drugs: ["CLOPIDOGREL"],
    evidence: ["rs4244285 → *2 → No function → Clopidogrel reduced activation"],
  },
  CYP2C9: {
    about: "CYP2C9 metabolizes warfarin and NSAIDs. Reduced function variants increase bleeding risk with warfarin.",
    phenotypes: ["PM/IM – decreased", "NM – normal"],
    drugs: ["WARFARIN"],
    evidence: ["rs1799853 → *2 → Decreased function → Lower warfarin dose"],
  },
  SLCO1B1: {
    about: "SLCO1B1 transports statins into hepatocytes. Reduced function increases myopathy risk.",
    phenotypes: ["Decreased function", "Normal function"],
    drugs: ["SIMVASTATIN"],
    evidence: ["rs4149056 → *5 → Decreased transport → Simvastatin myopathy risk"],
  },
  TPMT: {
    about: "TPMT inactivates thiopurines. Reduced function leads to severe myelosuppression risk.",
    phenotypes: ["Low/Intermediate activity", "Normal activity"],
    drugs: ["AZATHIOPRINE"],
    evidence: ["TPMT *3C → Reduced activity → Lower azathioprine dose"],
  },
  DPYD: {
    about: "DPYD catabolizes fluoropyrimidines. Deficiency can cause severe toxicity.",
    phenotypes: ["Deficient/Reduced", "Normal"],
    drugs: ["FLUOROURACIL"],
    evidence: ["rs3918290 → *2A → DPD deficiency → Avoid or reduce dose"],
  },
};

export const DRUG_INFO: Record<string, { primaryGenes: string[]; actions: string[]; sampleEvidence: Array<{ rsid: string; gene: string; star: string; note: string }> }> = {
  CODEINE: {
    primaryGenes: ["CYP2D6"],
    actions: ["Avoid in URM and PM phenotypes", "Consider alternatives (e.g., morphine, hydromorphone)"],
    sampleEvidence: [{ rsid: "rs3892097", gene: "CYP2D6", star: "*4", note: "Loss-of-function; ineffective activation" }],
  },
  WARFARIN: {
    primaryGenes: ["CYP2C9"],
    actions: ["Lower initial dose in decreased function", "Frequent INR monitoring"],
    sampleEvidence: [{ rsid: "rs1799853", gene: "CYP2C9", star: "*2", note: "Decreased metabolism; dose reduction" }],
  },
  CLOPIDOGREL: {
    primaryGenes: ["CYP2C19"],
    actions: ["Avoid in PM/IM; consider prasugrel/ticagrelor", "Monitor platelet function if used"],
    sampleEvidence: [{ rsid: "rs4244285", gene: "CYP2C19", star: "*2", note: "No function; reduced activation" }],
  },
  SIMVASTATIN: {
    primaryGenes: ["SLCO1B1"],
    actions: ["Use lower dose or alternative statin", "Monitor for myopathy"],
    sampleEvidence: [{ rsid: "rs4149056", gene: "SLCO1B1", star: "*5", note: "Decreased transport; myopathy risk" }],
  },
  AZATHIOPRINE: {
    primaryGenes: ["TPMT"],
    actions: ["Substantially reduce starting dose or choose alternative", "Close CBC monitoring"],
    sampleEvidence: [{ rsid: "—", gene: "TPMT", star: "*3C", note: "Reduced activity; toxicity risk" }],
  },
  FLUOROURACIL: {
    primaryGenes: ["DPYD"],
    actions: ["Avoid or greatly reduce dose in deficiency", "Monitor closely for toxicity"],
    sampleEvidence: [{ rsid: "rs3918290", gene: "DPYD", star: "*2A", note: "Deficiency; high toxicity risk" }],
  },
};
