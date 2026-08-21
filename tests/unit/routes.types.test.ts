/**
 * Type-level tests for routes
 *
 * These tests verify that the route types are correct at compile time.
 * Run with: bunx tsc --noEmit tests/unit/routes.types.test.ts
 */

import { routes } from "../../src/routes";
import { wildcardRoutes } from "./route-test-fixtures";

// Helper type for type-level assertions
type Equals<T, U> =
  (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? true : false;

// ========================================
// Static route types
// ========================================

type HomeType = typeof routes.$home;
type HomeTypeTest = Equals<HomeType, "/">;
const _homeTypeTest: HomeTypeTest = true;

type AuthType = typeof routes.$auth;
type AuthTypeTest = Equals<AuthType, "/auth">;
const _authTypeTest: AuthTypeTest = true;

type StaticLoginType = typeof routes.auth.login;
type StaticLoginTest = Equals<StaticLoginType, "/login">;
const staticLoginTest: StaticLoginTest = true;

type StaticLoginFullType = typeof routes.auth.$login;
type StaticLoginFullTest = Equals<StaticLoginFullType, "/auth/login">;
const staticLoginFullTest: StaticLoginFullTest = true;

// ========================================
// Template literal param types
// ========================================

const programRoute = routes.programs.$(":programId");
type ProgramRouteType = typeof programRoute;

type TemplateParamType = ReturnType<ProgramRouteType["toString"]>;
type TemplateParamTest = Equals<TemplateParamType, "/programs/:programId">;
const templateParamTest: TemplateParamTest = true;

// toString() return type
type TemplateParamStringType = ReturnType<ProgramRouteType["toString"]>;
type TemplateParamStringTest = Equals<TemplateParamStringType, "/programs/:programId">;
const templateParamStringTest: TemplateParamStringTest = true;

// ========================================
// Nested template literal params
// ========================================

const nestedRoute = routes.programs.$(":programId").courses.$(":courseId");
type NestedRouteType = typeof nestedRoute;

type NestedTemplateType = ReturnType<NestedRouteType["toString"]>;
type NestedTemplateTest = Equals<NestedTemplateType, "/programs/:programId/courses/:courseId">;
const nestedTemplateTest: NestedTemplateTest = true;

// ========================================
// Static routes under template params
// ========================================

type StaticUnderTemplateType = ReturnType<NestedRouteType["lessons"]["$"]>["$edit"];
const staticUnderTemplateTest: StaticUnderTemplateType =
  "/programs/:programId/courses/:courseId/lessons/:lessonId/edit";

type LessonCompleteRouteType = ReturnType<NestedRouteType["lessons"]["$"]>["$complete"];
const lessonCompleteRouteTest: LessonCompleteRouteType =
  "/programs/:programId/courses/:courseId/lessons/:lessonId/complete";

// ========================================
// Runtime values should have string type (not literal)
// ========================================

const runtimeRoute = routes.programs.$(123);
type RuntimeRouteType = typeof runtimeRoute;
type RuntimeParamType = ReturnType<RuntimeRouteType["toString"]>;
type RuntimeParamTest = Equals<RuntimeParamType, string>;
const runtimeParamTest: RuntimeParamTest = true;

// ========================================
// Deeply nested static route
// ========================================

type LessonsType = ReturnType<NestedRouteType["lessons"]["toString"]>;
type DeepStaticTest = Equals<LessonsType, "/programs/:programId/courses/:courseId/lessons">;
const deepStaticTest: DeepStaticTest = true;

// ========================================
// Relative paths under dynamic routes
// ========================================

type RelativeUnderDynamicType = ProgramRouteType["$edit"];
const relativeUnderDynamicTest: RelativeUnderDynamicType = "/programs/:programId/edit";

// ========================================
// Parsed route types
// ========================================

const parsedRoute = routes.parse("/programs/program-1/courses/course-1/lessons/lesson-1/edit");

if (parsedRoute?.routeKey === "programs.$.courses.$.lessons.$.edit") {
  const _programIdParam: string = parsedRoute.params.programId;
  const _courseIdParam: string = parsedRoute.params.courseId;
  const _lessonIdParam: string = parsedRoute.params.lessonId;

  // @ts-expect-error answer index does not belong to this route
  const _missingAnswerParam = parsedRoute.params.aIdx;
}

const lessonRoute = routes.programs.$(":programId").courses.$(":courseId").lessons.$(":lessonId");
type QuestionsPathType = typeof lessonRoute.$questions;
type QuestionsPathTest = Equals<
  QuestionsPathType,
  "/programs/:programId/courses/:courseId/lessons/:lessonId/questions"
>;
const _questionsPathTest: QuestionsPathTest = true;

const wildcardRoute = wildcardRoutes.lab.$(":labId").widgets.$(":widgetId").action;
type WildcardPathType = typeof wildcardRoute.$_wildcard;
type WildcardPathTest = Equals<WildcardPathType, "/lab/:labId/widgets/:widgetId/action/*">;
const wildcardPathTest: WildcardPathTest = true;
// @ts-expect-error wildcard parser patterns are represented by $_wildcard strings
const _missingWildcard = wildcardRoute._wildcard;

const parsedWildcardRoute = wildcardRoutes.parse(
  wildcardRoute.$_wildcard,
  "/lab/lab-1/widgets/widget-1/action/row/row-1/move/down",
);

if (parsedWildcardRoute?.routeKey === "row.$.move.down") {
  const _labIdParam: string = parsedWildcardRoute.params.labId;
  const _widgetIdParam: string = parsedWildcardRoute.params.widgetId;
  const _rowIdParam: string = parsedWildcardRoute.params.rowId;

  // @ts-expect-error missing param does not belong to this route
  const _missingColumnParam = parsedWildcardRoute.params.columnId;
}

routes.programs.$(":programId");
// @ts-expect-error template params must match the route config param name
routes.programs.$(":id");

// Export all tests to prevent "unused variable" errors
export {
  deepStaticTest,
  lessonCompleteRouteTest,
  nestedTemplateTest,
  relativeUnderDynamicTest,
  runtimeParamTest,
  staticLoginFullTest,
  staticLoginTest,
  staticUnderTemplateTest,
  templateParamStringTest,
  templateParamTest,
  wildcardPathTest,
};
