# College Sim V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first modular Demo for a university life simulator that can create a run, play through at least one month, persist key state, and generate an AI monthly journal.

**Architecture:** The app uses Next.js for the local UI shell, a pure TypeScript rule engine for deterministic game outcomes, Supabase access wrappers for persistence, and a tightly constrained AI layer that only converts structured summaries into monthly journals or ending reports.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Supabase SDK, OpenAI-compatible server endpoint, Vitest

---

## Milestones

- [ ] Phase 1: Initialize the repository, project scaffold, shared types, architecture docs, and placeholder routes.
- [ ] Phase 2A: Implement Supabase client, minimal schema, and repository helpers.
- [ ] Phase 2B: Implement deterministic generators, rule resolvers, monthly progression, and event data structures.
- [ ] Phase 2C: Implement interactive demo pages, UI components, and AI report adapters that only accept structured summaries.
- [ ] Phase 3: Integrate modules, resolve type mismatches, verify one-month local flow, and update README.

## File Ownership

- Main agent foundation: `package.json`, `README.md`, `.gitignore`, `docs/architecture.md`, `types/*`
- Agent A: `lib/supabase/*`, `db/*`, persistence-related additions in `types/*`
- Agent B: `core/game-engine/*`, `core/generators/*`, `core/resolvers/*`, `data/*`, rule-related additions in `types/*`
- Agent C: `app/*`, `components/*`, `lib/ai/*`, `core/prompts/*`, UI-facing additions in `types/*`

## Integration Notes

- The rule engine must run without a database.
- The UI must consume structured results, not derive them.
- AI prompts must never contain hidden game logic.
- `.env.local` remains local-only and must never be committed.

