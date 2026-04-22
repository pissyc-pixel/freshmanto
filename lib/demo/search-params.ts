export type DemoPageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export function readSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

