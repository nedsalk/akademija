import { routes } from "../../../../src/routes";
import type { Course, User } from "../../dsl/types";
import type { AttendanceDriver } from "../interface";
import { PWDriver } from "./base-driver";

export class PlaywrightAttendanceDriver extends PWDriver implements AttendanceDriver {
  async saveRule(teacher: User, course: Course, maxMissed: number): Promise<void> {
    const page = this.getPage(teacher);
    await this.openCourse(teacher, course);
    await page.locator('input[name="maxConsecutiveMissedLessons"]').fill(String(maxMissed));
    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.getByRole("button", { name: "Save Attendance Rule" }).click(),
    ]);
  }

  async postRule(teacher: User, course: Course, maxMissed: string): Promise<number> {
    const page = this.getPage(teacher);
    const response = await page.request.post(
      routes.programs.$(course.program.id).courses.$(course.id).attendance.$rule,
      {
        form: { maxConsecutiveMissedLessons: maxMissed },
        maxRedirects: 0,
      },
    );

    return response.status();
  }

  async openCourse(user: User, course: Course): Promise<void> {
    const page = this.getPage(user);
    await page.goto(routes.programs.$(course.program.id).courses.$(course.id).toString(), {
      waitUntil: "domcontentloaded",
    });
  }

  async evaluateAttendance(teacher: User, course: Course): Promise<void> {
    const page = this.getPage(teacher);
    await this.openCourse(teacher, course);
    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.getByRole("button", { name: "Evaluate Attendance" }).click(),
    ]);
  }

  async setCurrentDate(
    user: User,
    args: { isoDate?: string; advanceByDays?: number },
  ): Promise<void> {
    const page = this.getPage(user);
    await page.request.post(routes.api.test.$setNow, {
      data: JSON.stringify(args),
    });
  }

  async acknowledgeViolation(teacher: User, studentName: string): Promise<void> {
    const page = this.getPage(teacher);
    const row = page.getByRole("row").filter({ hasText: studentName }).first();
    await Promise.all([
      page.waitForLoadState("networkidle"),
      row.getByRole("button", { name: "Acknowledge" }).click(),
    ]);
  }

  async getViolationId(teacher: User, course: Course, studentName: string): Promise<string> {
    const page = this.getPage(teacher);
    await this.openCourse(teacher, course);
    const row = page.getByRole("row").filter({ hasText: studentName }).first();
    const action = await row
      .getByRole("button", { name: "Acknowledge" })
      .getAttribute("formaction");
    const violationId = action?.split("violationId=").at(1);
    if (!violationId) {
      throw new Error(`Violation id missing for ${studentName}`);
    }
    return violationId;
  }

  async postAcknowledgement(args: {
    teacher: User;
    course: Course;
    violationId: string;
  }): Promise<number> {
    const page = this.getPage(args.teacher);
    const response = await page.request.post(
      `${
        routes.programs.$(args.course.program.id).courses.$(args.course.id).attendance.$acknowledge
      }?violationId=${args.violationId}`,
      { maxRedirects: 0 },
    );

    return response.status();
  }

  async seesRuleSaved(teacher: User, maxMissed: number): Promise<boolean> {
    const page = this.getPage(teacher);
    return (
      (await page.locator('input[name="maxConsecutiveMissedLessons"]').inputValue()) ===
      String(maxMissed)
    );
  }

  async seesNoViolations(teacher: User): Promise<boolean> {
    const page = this.getPage(teacher);
    return (await page.getByText("No attendance violations.").count()) > 0;
  }

  async seesViolation(
    teacher: User,
    studentName: string,
    missedCount: number,
    status: "open" | "acknowledged",
  ): Promise<boolean> {
    const page = this.getPage(teacher);
    const row = page.getByRole("row").filter({ hasText: studentName }).first();
    const text = await row.textContent();
    return (text?.includes(`Missed ${missedCount}`) && text?.includes(status)) ?? false;
  }
}
