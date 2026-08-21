import { routes } from "../../../../src/routes";
import type { Visitor } from "../../dsl/types";
import type { TeacherDriver } from "../interface";
import { PWDriver } from "./base-driver";

export class PlaywrightTeacherDriver extends PWDriver implements TeacherDriver {
  async navigateToTeacherDashboard(visitor: Visitor): Promise<void> {
    const page = this.getPage(visitor);
    await page.goto(routes.$teacher);
  }

  async seesTeacherDashboard(visitor: Visitor): Promise<boolean> {
    const page = this.getPage(visitor);
    const heading = await page.locator("h1").textContent();
    return heading?.includes("Teacher Dashboard") ?? false;
  }

  async seesAccessDenied(visitor: Visitor): Promise<boolean> {
    const page = this.getPage(visitor);
    const heading = await page.locator("h1").textContent();
    return heading?.includes("Access Denied") ?? false;
  }
}
