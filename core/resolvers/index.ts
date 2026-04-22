export const RESOLVER_BOUNDARY = {
  owns: ["action effects", "event outcomes", "semester and ending labels"],
  excludes: ["prompt text generation", "database mutations"]
} as const;

