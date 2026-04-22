export const endingReportPromptContract = {
  name: "ending-report",
  purpose: "Convert ending facts and labels into a grounded graduation report.",
  inputRule: "Never infer decisive facts that are not present in the summary."
} as const;

