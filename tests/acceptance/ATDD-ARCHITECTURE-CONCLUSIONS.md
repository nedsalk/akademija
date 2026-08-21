# ATDD Architecture Conclusions

- The root issue was not the shared Playwright page registry. It was a DSL phrase whose implementation performed an extra actor transition that the phrase did not name.
- Shared browser state is acceptable at the driver layer when drivers receive an explicit actor for each operation. The risk appears when the DSL passes broad argument objects containing multiple actors to operations that only need one.
- Prefer narrow context types for DSL operations. A student action should accept a student-oriented context, not a teacher/student/program bag.
- A When phrase should model one observable action. It should not prepare another actor's page for a later assertion.
- Teacher-facing observations should be expressed by a teacher-facing Given or Then. Student-facing actions should leave the student context intact unless the phrase says otherwise.
- Typed actor sessions would make misuse more visible: student driver methods would accept a student session, teacher methods would accept a teacher session, and page access would move through that session instead of a generic user lookup.
- The current base driver can remain, but DSL and driver method signatures should keep actor boundaries explicit.
