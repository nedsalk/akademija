import type { DSL } from "../dsl";

export interface Specification extends Record<string, (dsl: DSL) => Promise<void>> {}
