import { routes } from "../../../../src/routes";
import type { Program, User } from "../../dsl/types";
import type { EnrollmentDriver } from "../interface";
import { PWDriver } from "./base-driver";

export class PlaywrightEnrollmentDriver extends PWDriver implements EnrollmentDriver {
  private async gotoProgramsPage(student: User) {
    const page = this.getPage(student);
    await page.goto(routes.$programs, { waitUntil: "domcontentloaded" });
    return page;
  }

  async getVisibleProgramNames(student: User): Promise<string[]> {
    const page = await this.gotoProgramsPage(student);

    return page
      .locator("ul li > a")
      .evaluateAll((links) => links.map((link) => link.textContent?.trim() ?? "").filter(Boolean));
  }

  async requestEnrollment(student: User, program: Program): Promise<void> {
    const page = await this.gotoProgramsPage(student);

    await this.submitAndWaitForPath({
      action: () =>
        page
          .locator(`form[action="${routes.programs.$(program.id).$enroll}"]`)
          .locator('button[type="submit"]')
          .click(),
      page,
      pathname: routes.$programs,
    });
  }

  async requestEnrollments(students: User[], program: Program): Promise<void> {
    await Promise.all(students.map((student) => this.requestEnrollment(student, program)));
  }

  async getEnrollmentStatus(student: User, program: Program): Promise<string | null> {
    const page = await this.gotoProgramsPage(student);

    const programItem = page.locator("li").filter({ hasText: program.name });
    const text = await programItem.first().textContent();

    if (!text?.includes("Enrollment status:")) {
      return null;
    }

    return text.split("Enrollment status:").at(1)?.trim() ?? null;
  }

  async canRequestEnrollment(student: User, program: Program): Promise<boolean> {
    const page = await this.gotoProgramsPage(student);

    return (
      (await page.locator(`form[action="${routes.programs.$(program.id).$enroll}"]`).count()) > 0
    );
  }
}
