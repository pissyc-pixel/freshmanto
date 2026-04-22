export const monthlyJournalPromptContract = {
  name: "monthly-journal",
  purpose: "Convert rule-engine facts into a grounded monthly diary entry.",
  inputRule: "Only accept structured facts produced by the rule engine."
} as const;

