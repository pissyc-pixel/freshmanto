import { cookies } from "next/headers";

import { ACTIVE_RUN_COOKIE } from "@/lib/demo/active-run";

export async function readActiveRunIdFromCookies() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(ACTIVE_RUN_COOKIE)?.value;
  } catch {
    return undefined;
  }
}
