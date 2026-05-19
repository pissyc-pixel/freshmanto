import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { stripWeeklySettlementFocus } from "@/components/weekly-settlement-modal";

describe("weekly settlement modal helpers", () => {
  it("removes the weekly-settlement focus query without disturbing runId", () => {
    expect(stripWeeklySettlementFocus("/game?runId=demo&focus=weekly-settlement")).toBe("/game?runId=demo");
    expect(stripWeeklySettlementFocus("/game?focus=weekly-settlement&runId=demo")).toBe("/game?runId=demo");
  });

  it("leaves unrelated focus values untouched", () => {
    expect(stripWeeklySettlementFocus("/game?runId=demo&focus=planner")).toBe("/game?runId=demo&focus=planner");
  });
});

describe("weekly settlement modal close chain", () => {
  const modalSource = readFileSync("components/weekly-settlement-modal.tsx", "utf-8");
  const hostSource = readFileSync("components/weekly-settlement-modal-host.tsx", "utf-8");
  const gamePageSource = readFileSync("app/game/page.tsx", "utf-8");

  it("modal accepts onClose callback instead of closeHref", () => {
    expect(modalSource).toContain("onClose: () => void");
    expect(modalSource).not.toContain("closeHref");
    expect(modalSource).not.toContain("replaceUrlWithoutReload");
  });

  it("modal returns null when open is false", () => {
    expect(modalSource).toContain("if (!mounted || !open || !settlement)");
    expect(modalSource).toContain("return null");
  });

  it("modal renders portal to document.body when open", () => {
    expect(modalSource).toContain("createPortal(");
    expect(modalSource).toContain("document.body");
  });

  it("overlay has data-testid and calls onClose on click", () => {
    expect(modalSource).toContain('data-testid="weekly-settlement-overlay"');
    expect(modalSource).toContain("onClick={onClose}");
  });

  it("panel has data-testid and stops propagation", () => {
    expect(modalSource).toContain('data-testid="weekly-settlement-panel"');
    expect(modalSource).toContain("event.stopPropagation()");
  });

  it("close button has data-testid and calls onClose", () => {
    expect(modalSource).toContain('data-testid="weekly-settlement-close"');
    expect(modalSource).toContain("onClick={onClose}");
  });

  it("ESC handler calls onClose with preventDefault", () => {
    expect(modalSource).toContain('event.key === "Escape"');
    expect(modalSource).toContain("event.preventDefault()");
    expect(modalSource).toContain("onClose()");
  });

  it("ESC listener is added when open and removed on cleanup", () => {
    expect(modalSource).toContain('window.addEventListener("keydown", handleKeyDown)');
    expect(modalSource).toContain('window.removeEventListener("keydown", handleKeyDown)');
    expect(modalSource).toContain("if (!open)");
  });

  it("host component uses dismissed state to prevent re-opening", () => {
    expect(hostSource).toContain("useState(false)");
    expect(hostSource).toContain("setDismissed(true)");
    expect(hostSource).toContain("!dismissed");
  });

  it("host component accepts string | undefined for focusParam", () => {
    expect(hostSource).toContain("string | undefined");
  });

  it("host component uses history.replaceState to clean URL on close", () => {
    expect(hostSource).toContain("window.history.replaceState(");
    expect(hostSource).toContain("stripWeeklySettlementFocus(");
  });

  it("game page uses WeeklySettlementModalHost with focusParam", () => {
    expect(gamePageSource).toContain("WeeklySettlementModalHost");
    expect(gamePageSource).toContain("focusParam={focusParam}");
    expect(gamePageSource).not.toMatch(/<WeeklySettlementModal[\s\n]/);
  });

  it("keeps weekly kickoff dialog portaled to document.body", () => {
    const kickoffSource = readFileSync("components/weekly-kickoff-modal.tsx", "utf-8");
    expect(kickoffSource).toContain("document.body");
    expect(kickoffSource).toContain("event.currentTarget === event.target");
    expect(kickoffSource).toContain("event.key === \"Escape\"");
  });
});
