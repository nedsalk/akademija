---
name: domain-modeling
description: Model business capabilities as a rich domain that owns invariants, valid construction, calculations, policies, and state transitions while keeping application code as thin orchestration. Use when implementing business rules, entities, value objects, aggregates, eligibility policies, calculations, workflows, or behavior derived from acceptance specifications.
---

# Domain Modeling

Put business decisions in the domain. Keep the application layer responsible for loading facts, invoking domain behavior, persisting returned state, and performing declared external effects.

## Find the Domain Behavior

1. Read the relevant acceptance specifications and existing domain vocabulary.
2. Identify the business invariant, calculation, policy, or state transition behind the behavior.
3. Identify the concept that naturally owns that behavior.
4. Define the smallest coherent public capability that preserves its guarantees.
5. Write black-box unit scenarios against that capability before implementing it.
6. Implement the domain behavior and make the application consume its result directly.
7. Run the unit and acceptance specifications that cover the behavior.

Do not extract code merely because it is pure. Parsing transport input, trimming form fields, shaping persistence records, building routes, and rendering errors are not domain behavior unless they express an actual business rule.

## Own Invariants

- Treat an invariant as a condition every valid instance must satisfy throughout its lifetime, not as validation performed near an endpoint.
- Establish invariants at creation boundaries and preserve them through every public transition.
- Make invalid states difficult or impossible to represent.
- Do not expose unchecked constructors, setters, or structural types that let callers bypass domain guarantees.
- Return either valid domain state or a domain-specific failure. Never return partially valid state.
- Revalidate persisted data when restoring it unless the persistence boundary is explicitly trusted to preserve the same guarantees.
- Back concurrency-sensitive invariants with an atomic transaction, compare-and-set, uniqueness constraint, or another persistence guarantee. An in-memory permission check alone is insufficient.

## Model Capabilities, Not Helpers

- Prefer operations that perform a complete domain transition over predicates such as `canSubmit`, `isAllowed`, or `validate` followed by application-layer mutation.
- Return the resulting state, transition, or effects that the application must persist or execute.
- Keep representation, validators, normalizers, and intermediate calculations private unless they are intentional domain concepts.
- Use a domain service only when a rule spans concepts and has no natural entity or aggregate owner.
- Do not force classes, aggregates, value objects, or branded types. Use the simplest TypeScript design that actually preserves the guarantees.
- Do not optimize for the fewest exports. Optimize for a small, coherent behavioral API.

For example, prefer:

```typescript
assessment.submit(command) -> Result<AssessmentAttempt, SubmissionError>
```

over:

```typescript
canSubmitAssessment(facts) -> Result<true, SubmissionError>
calculateScore(answers) -> number
getRetryDate(status) -> Date | null
```

when the application would otherwise assemble the attempt and could violate its invariants.

## Keep the Application Thin

The normal application flow is:

```text
load domain state and required facts
-> invoke one domain capability
-> handle the domain result
-> persist the returned transition atomically
-> perform returned external effects
```

The application layer may decide when a use case runs. The domain decides whether it is allowed and what valid state or effects result.

Do not let the application:

- Reimplement or pre-check domain policy with its own conditionals.
- Construct domain outcomes from independent helper results.
- Mutate domain data directly.
- Duplicate calculations or transition rules.
- Persist a transition that was authorized against stale state.

Keep database queries, transactions, HTTP, UI, framework types, and external service calls outside the pure domain. Pass the facts required for a decision into the domain. Pass clocks, identity generation, and other nondeterminism explicitly when the behavior depends on them.

## Separate Validation Concerns

- Transport validation answers whether input can be decoded. Keep it at the boundary.
- Domain value validation answers whether a value is meaningful in the domain. Keep it in the domain.
- Transition validation answers whether behavior is allowed in the current state. Keep it in the domain operation that performs the transition.
- External facts such as uniqueness or ownership may require application queries, but the domain should decide their business meaning.

## Test Public Behavior

- Test domain capabilities as black boxes using business scenarios.
- Assert valid results, rejected transitions, preserved invariants, and emitted effects.
- Do not organize tests around private helpers or mirror the implementation algorithm.
- Include boundary cases that define the invariant.
- Do not mock owned domain behavior.
- Keep acceptance specifications as the final proof that the application correctly uses the domain.

## Completion Criteria

- Business decisions and invariants have one domain owner.
- Public operations cannot produce invalid domain state.
- The application loads, invokes, persists, and performs effects without reconstructing domain decisions.
- Concurrency-sensitive guarantees are enforced atomically.
- Unit scenarios cover the public domain capability.
- Relevant acceptance specifications still pass.
