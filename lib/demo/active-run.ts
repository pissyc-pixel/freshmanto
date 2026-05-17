export const ACTIVE_RUN_COOKIE = "fm_active_run";
export const ACTIVE_RUN_STORAGE_KEY = "freshmanto.activeRunId";

type BuildRunHrefValue = string | number | boolean | null | undefined;

export function normalizeRunId(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveActiveRunId(input: {
  searchParamRunId?: string | null;
  cookieRunId?: string | null;
}) {
  return normalizeRunId(input.searchParamRunId) ?? normalizeRunId(input.cookieRunId);
}

export function buildRunHref(
  pathname: string,
  runId?: string | null,
  params?: Record<string, BuildRunHrefValue>,
) {
  const search = new URLSearchParams();
  const normalizedRunId = normalizeRunId(runId);

  if (normalizedRunId) {
    search.set("runId", normalizedRunId);
  }

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}
