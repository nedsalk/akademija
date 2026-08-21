---
name: atdd
description: Drive behavior changes from executable acceptance specifications through specification, DSL, protocol driver, and test runner layers. Use for new behavior, bug fixes, Given-When-Then scenarios, acceptance-test changes, or requests to work specification-first or in ATDD mode.
---

# Acceptance Test Driven Development

Treat executable specifications as the source of truth. Translate requested behavior into the smallest implementation that makes the specifications pass while preserving every existing specification.

## Follow the ATDD Loop

1. Read the relevant existing specifications, DSL operations, drivers, and production behavior.
2. Express the requested behavior as a precise acceptance example.
3. Add or change the executable specification first.
4. Run it and confirm that it fails for the expected behavioral reason.
5. Extend the DSL and driver only as required by the specification.
6. Implement the smallest correct production change.
7. Re-run the relevant specification until it passes.
8. Run all specifications before finishing.

Do not skip the observed red phase. A compile error, broken fixture, or unrelated infrastructure failure is not the expected failing specification.

## Refine Specifications

- Preserve user-provided Given-When-Then wording and intent.
- Derive only behavior directly entailed by the request. Do not invent policies, edge cases, validation rules, messages, or adjacent features.
- Ask for clarification when the observable outcome is ambiguous or specifications conflict.
- Use concrete examples where they remove ambiguity.
- Give each specification one observable outcome.
- Use at most one Given, one When, and one Then operation.
- Fold compound setup into one domain-level Given.
- Reuse the same Given and When in separate specifications when multiple outcomes must be demonstrated.
- Omit Given when the action establishes all required context.
- Omit When for baseline behavior or invariants that require only a starting state and an observable outcome.
- Do not add an artificial step merely to complete the Given-When-Then form.

Before accepting specification language, check that:

- A domain expert with no knowledge of the code could understand it.
- It would remain valid if implementation details changed without changing behavior.

If either check fails, move the implementation detail beneath the specification layer.

## Preserve the Four Layers

### Specifications

Keep specifications as pure functions receiving the DSL.

- Use only domain language and DSL operations.
- Keep framework imports, browser objects, routes, selectors, HTTP, database details, and implementation assertions out.
- Describe user-visible behavior rather than a UI interaction script.
- Do not weaken an existing specification to make an implementation pass unless the requirement explicitly changed.

### DSL

Use the DSL layer to translate domain phrases into driver operations.

- Put sensible defaults, unique test data, compound setup, scenario context, and assertions here.
- Reuse an existing phrase when it represents the same domain operation.
- Add a phrase only for a genuinely new domain concept.
- Make each DSL phrase do exactly what its text says.
- Do not switch actors inside a When phrase unless the phrase names that actor.
- Do not navigate inside a When phrase unless the phrase says "opens", "goes to", or "returns to".
- Prefer narrow, role-specific argument shapes over broad bags containing unrelated actors.
- If a Then needs a different actor's view, create a Given that places that actor in that view or make the navigation explicit in the Then.
- Before reusing a DSL phrase, read its implementation and verify it has no hidden side effects.
- Let a domain DSL depend on its own driver.
- For cross-domain behavior, depend on the other domain's DSL rather than its driver.
- Do not reach through another DSL or import another domain's driver directly.
- Keep business decisions in production code rather than hiding them in the DSL.

Before accepting a DSL operation, check whether a domain expert could infer every actor and state transition from the phrase text alone. If not, split or rename the operation.

### Drivers

Keep protocol-specific knowledge in drivers.

- Extend the driver contract only for interactions required by the specification.
- Interact with the system through public boundaries.
- Centralize technical interaction, waiting, and observation details in the driver.
- Preserve functional isolation so specifications do not depend on order or shared state.

### Runner

Keep runners limited to framework wiring, specification registration, dependency creation, and cleanup.

Register a new group only when adding a new specification domain.

## Diagnose Failures

Classify a failing specification before changing code:

- Translation failure: the DSL, driver, fixture, timing, isolation, or runner no longer translates the specification correctly. Fix that infrastructure layer.
- Specification failure: production behavior does not satisfy the executable specification. Fix production code unless the requirement changed.

Do not hide intermittent failures with retries or sleeps. Remove the underlying isolation, timing, or shared-state problem.

## Completion Criteria

- The requested behavior is represented by a readable executable specification.
- The specification failed first for the expected reason.
- The four layers remain separated.
- The relevant specification passes.
- Existing specifications still pass.
