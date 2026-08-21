import { describe, expect, it } from "vitest";
import { routes } from "../../src/routes";
import { wildcardRoutes } from "./route-test-fixtures";

describe("routes", () => {
  describe("relative paths", () => {
    it("returns relative path for login", () => {
      expect(routes.auth.login).toBe("/login");
    });

    it("returns relative path for register", () => {
      expect(routes.auth.register).toBe("/register");
    });

    it("returns relative path for logout", () => {
      expect(routes.auth.logout).toBe("/logout");
    });
  });

  describe("full paths via $ prefix", () => {
    it("returns full path for login", () => {
      expect(routes.auth.$login).toBe("/auth/login");
    });

    it("returns full path for register", () => {
      expect(routes.auth.$register).toBe("/auth/register");
    });

    it("returns full path for logout", () => {
      expect(routes.auth.$logout).toBe("/auth/logout");
    });

    it("returns full path for auth base", () => {
      expect(routes.$auth).toBe("/auth");
    });
  });

  describe("type safety", () => {
    it("returns primitive strings", () => {
      expect(typeof routes.auth.login).toBe("string");
      expect(typeof routes.auth.$login).toBe("string");
    });
  });

  describe("dynamic routes with $", () => {
    it("returns base path for dynamic segment", () => {
      expect(routes.programs.$(123).toString()).toBe("/programs/123");
    });

    it("supports string param values", () => {
      expect(routes.programs.$("abc").toString()).toBe("/programs/abc");
    });

    it("supports nested static routes under dynamic segment", () => {
      expect(routes.programs.$(123).$courses).toBe("/programs/123/courses");
    });

    it("supports static routes under dynamic segment", () => {
      expect(routes.programs.$(123).$edit).toBe("/programs/123/edit");
    });

    it("supports nested dynamic routes", () => {
      expect(routes.programs.$(123).courses.$(456).toString()).toBe("/programs/123/courses/456");
    });

    it("supports deeply nested dynamic routes", () => {
      expect(routes.programs.$(123).courses.$(456).lessons.toString()).toBe(
        "/programs/123/courses/456/lessons",
      );
    });

    it("$ function returns an object with nested routes", () => {
      const dynamic = routes.programs.$(123);
      expect(typeof dynamic).toBe("object");
      expect(dynamic).toHaveProperty("toString");
      expect(dynamic).toHaveProperty("courses");
    });

    it("toString() returns the path for dynamic routes", () => {
      expect(String(routes.programs.$(123))).toBe("/programs/123");
    });

    it("toString() works in template literals", () => {
      expect(`${routes.programs.$(123)}`).toBe("/programs/123");
    });

    it("toString() works for nested dynamic routes", () => {
      expect(String(routes.programs.$(123).courses.$(456))).toBe("/programs/123/courses/456");
    });

    it("toString() works alongside property access", () => {
      const programRoute = routes.programs.$(123);
      expect(String(programRoute)).toBe("/programs/123");
      expect(`${programRoute}`).toBe("/programs/123");
      expect(programRoute.$edit).toBe("/programs/123/edit");
    });

    it("supports template literal params for Hono routes", () => {
      const route = routes.programs.$(":programId");
      expect(route.toString()).toBe("/programs/:programId");
      expect(String(route)).toBe("/programs/:programId");
    });

    it("supports nested template literal params", () => {
      const route = routes.programs.$(":programId").courses.$(":courseId");
      expect(route.toString()).toBe("/programs/:programId/courses/:courseId");
      expect(String(route)).toBe("/programs/:programId/courses/:courseId");
    });

    it("template params work with static nested routes", () => {
      const route = routes.programs.$(":programId").courses.$(":courseId");
      expect(route.lessons.$(":lessonId").$edit).toBe(
        "/programs/:programId/courses/:courseId/lessons/:lessonId/edit",
      );
    });

    it("supports lesson completion routes", () => {
      const route = routes.programs.$(":programId").courses.$(":courseId");
      expect(route.lessons.$(":lessonId").$complete).toBe(
        "/programs/:programId/courses/:courseId/lessons/:lessonId/complete",
      );
    });
  });

  describe("route parsing", () => {
    it("parses static routes", () => {
      expect(routes.parse("/auth/login")).toEqual({
        params: {},
        routeKey: "auth.login",
      });
    });

    it("parses dynamic routes with named params", () => {
      expect(routes.parse("/programs/program-1/courses/course-1/lessons/lesson-1/edit")).toEqual({
        params: {
          courseId: "course-1",
          lessonId: "lesson-1",
          programId: "program-1",
        },
        routeKey: "programs.$.courses.$.lessons.$.edit",
      });
    });

    it("parses wildcard routes with params from the wildcard pattern and suffix", () => {
      const widgetRoute = wildcardRoutes.lab.$(":labId").widgets.$(":widgetId");

      expect(
        wildcardRoutes.parse(
          widgetRoute.action.$_wildcard,
          "/lab/lab-1/widgets/widget-1/action/row/row-1/move/down",
        ),
      ).toEqual({
        params: {
          labId: "lab-1",
          rowId: "row-1",
          widgetId: "widget-1",
        },
        routeKey: "row.$.move.down",
      });
    });

    it("returns wildcard route strings with the full route path", () => {
      const widgetRoute = wildcardRoutes.lab.$(":labId").widgets.$(":widgetId");

      expect(widgetRoute.action.$_wildcard).toBe("/lab/:labId/widgets/:widgetId/action/*");
    });

    it("returns null when a wildcard route does not match", () => {
      const widgetRoute = wildcardRoutes.lab.$(":labId").widgets.$(":widgetId");

      expect(
        wildcardRoutes.parse(
          widgetRoute.action.$_wildcard,
          "/lab/lab-1/widgets/widget-1/action/row/row-1/nope",
        ),
      ).toBeNull();
    });
  });
});
