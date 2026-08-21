# Project Instructions for Codex

This file is the canonical agent guide for this repository. It captures the project-specific rules that matter when working here with Codex or any other coding agent.

## Tech Stack

- Runtime: Bun
- Framework: Hono with SSR-first JSX
- Testing: Playwright and Vitest
- Database: Drizzle ORM with SQLite
- Auth: better-auth
- Linting: Biome
- UI: SSR JSX plus native web components extending `ParsedHTMLElement`

## Core Architecture: SSR-First

This is not React. JSX renders static HTML on the server.

1. Server renders complete HTML via Hono JSX.
2. Native HTML should handle standard behaviors like links, forms, and validation.
3. Web components should enhance behavior only where native HTML is insufficient.
4. Use `<template>` elements for client-side dynamic content.

Example:

```tsx
<questions-maker>
  <Question qIdx={0} />
  <template id="answer-template">
    <Answer qIdx={Infinity} aIdx={Infinity} val="" />
  </template>
</questions-maker>
```

Web component rules:

- Extend `ParsedHTMLElement`.
- Attach listeners in `parsingFinishedCallback()`.
- Use `data-action` attributes and event delegation.
- Do not render initial DOM in the web component. Enhance pre-rendered HTML only.

## Styling

- Native CSS only.
- No CSS frameworks, preprocessors, or CSS-in-JS.
- Prefer CSS nesting, logical properties, `:has()`, and design tokens.
- Keep styles component-scoped where practical.

## Testing Workflow

Use classicist ATDD:

1. Start with acceptance tests.
2. Run them and verify they fail for the expected reason.
3. Implement the feature.
4. Run the relevant tests again before finishing.
5. Run tests only through `package.json` scripts. Use `bun run test` for the full suite, `bun run test:e2e` for Playwright, `bun run test:unit` for Vitest, and `bun run test:e2e:ui` for Playwright UI.

Testing rules:

- Do not mock what we own.
- Use real DB and real internal services where practical.
- Mock only external APIs at the network boundary.
- Prefer domain-level adapters in Playwright tests instead of brittle UI selectors.

Two layers are expected:

- Acceptance tests in Playwright.
- Unit tests in Vitest for pure functions and utilities.

Selector guidance:

- For JS-enhanced controls, prefer `[data-action="..."]`.
- For forms, prefer semantic selectors such as `input[name]` and `button[type="submit"]`.
- Do not add `data-*` attributes only for tests when semantic HTML, form structure, URLs, or visible domain text are sufficient.

Browser tool guidance:

- Prefer Playwright MCP for acceptance-test work, scripted reproductions, and flows that should map cleanly to Playwright specs.
- Prefer Chrome MCP for debugging rendered HTML, checking DOM state, inspecting console errors, network traffic, accessibility tree, and manual reproduction of browser-only issues.
- When investigating a failing acceptance test, use Playwright MCP first to reproduce the scripted flow, then Chrome MCP if you need deeper inspection of DOM, console, or network behavior.
- Do not treat MCP exploration as a substitute for automated coverage. If behavior matters, capture it in Playwright or Vitest before finishing.
- For MCP inspection of isolated acceptance-test state, run the target spec with `MCP_HANDOFF=1 bunx playwright test -g "<spec name>"`.
- The handoff writes `.mcp/handoff.json` and pauses the test server until `.mcp/continue` exists.

## Key Patterns

Shared constants:

- Keep names, actions, and template IDs in one place when they are shared between JSX and web components.

Event delegation:

- Prefer a single parent listener with a `data-action` switch.
- This must continue to work for dynamically added content.

## Do Not Introduce

- React event handlers in JSX such as `onClick` or `onChange`.
- Web components that generate initial DOM.
- Narrow fixes that solve only one visible symptom when a shared root cause exists.

## Commands

```bash
bun run dev
bun run lint:fix
bun run fmt
bun run test
bun run test:e2e
bun run test:unit
bunx drizzle-kit generate
bunx drizzle-kit push
```

## Output

- Answer is always line 1. Reasoning comes after, never before.
- No preamble. No "Great question!", "Sure!", "Of course!", "Certainly!", "Absolutely!".
- No hollow closings. No "I hope this helps!", "Let me know if you need anything!".
- No restating the prompt. If the task is clear, execute immediately.
- No explaining what you are about to do. Just do it.
- No unsolicited suggestions. Do exactly what was asked, nothing more.
- Structured output only: bullets, tables, code blocks. Prose only when explicitly requested.

## Token Efficiency

- Compress responses. Every sentence must earn its place.
- No redundant context. Do not repeat information already established in the session.
- No long intros or transitions between sections.
- Short responses are correct unless depth is explicitly requested.

## Typography - ASCII Only

- No em dashes (-) - use hyphens (-)
- No smart/curly quotes - use straight quotes (" ')
- No ellipsis character - use three dots (...)
- No Unicode bullets - use hyphens (-) or asterisks (\*)
- No non-breaking spaces

## Sycophancy - Zero Tolerance

- Never validate the user before answering.
- Never say "You're absolutely right!" unless the user made a verifiable correct statement.
- Disagree when wrong. State the correction directly.
- Do not change a correct answer because the user pushes back.

## Accuracy and Speculation Control

- Never speculate about code, files, or APIs you have not read.
- If referencing a file or function: read it first, then answer.
- If unsure: say "I don't know." Never guess confidently.
- Never invent file paths, function names, or API signatures.
- If a user corrects a factual claim: accept it as ground truth for the entire session. Never re-assert the original claim.
- Whenever something doesn't work, you should first assume that your changes broke it. Code is always committed at working states.

## Code Output

- Avoid brittle, narrow solutions. When fixing bugs, always consider: is this the only case? Or does this fix apply more broadly? Is the band-aid solution correct. Prefer architecturally correct fixes, that solve the problem at the root and apply to all cases.
- Return the simplest working solution. No over-engineering.
- No abstractions or helpers for single-use operations.
- No speculative features or future-proofing.
- No docstrings or comments on code that was not changed.
- Inline comments only where logic is non-obvious.
- Read the file before modifying it. Never edit blind.

## Warnings and Disclaimers

- No safety disclaimers unless there is a genuine life-safety or legal risk.
- No "Note that...", "Keep in mind that...", "It's worth mentioning..." soft warnings.
- No "As an AI, I..." framing.

## Session Memory

- Learn user corrections and preferences within the session.
- Apply them silently. Do not re-announce learned behavior.
- If the user corrects a mistake: fix it, remember it, move on.

## Scope Control

- Do not add features beyond what was asked.
- Do not refactor surrounding code when fixing a bug.
- Do not create new files unless strictly necessary.

## Override Rule

User instructions always override this file.
