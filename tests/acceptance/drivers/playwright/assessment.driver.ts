import { routes } from "../../../../src/routes";
import type { Course, Program, Question, User } from "../../dsl/types";
import type { AssessmentDriver } from "../interface";
import { PWDriver } from "./base-driver";

export class PlaywrightAssessmentDriver extends PWDriver implements AssessmentDriver {
  async openCourse(student: User, course: Course): Promise<void> {
    const page = this.getPage(student);
    await page.goto(routes.programs.$(course.program.id).courses.$(course.id).toString(), {
      waitUntil: "domcontentloaded",
    });
  }

  async openProgram(student: User, program: Program): Promise<void> {
    const page = this.getPage(student);
    await page.goto(routes.programs.$(program.id).toString(), {
      waitUntil: "domcontentloaded",
    });
  }

  async publishWeeklyTest(args: {
    teacher: User;
    course: Course;
    questionTexts?: string[];
    opensOn?: string;
    closesOn?: string;
  }): Promise<void> {
    await this.publishAssessment({
      ...args,
      buttonName: "Publish Weekly Test",
    });
  }

  async publishFinalTest(args: {
    teacher: User;
    course: Course;
    questionTexts?: string[];
    opensOn?: string;
    closesOn?: string;
    passingThresholdPercent?: number;
  }): Promise<void> {
    const page = this.getPage(args.teacher);
    await this.openCourse(args.teacher, args.course);
    if (args.opensOn) {
      await page
        .locator('form[action$="/assessments/final"] input[name="opensOn"]')
        .fill(args.opensOn);
    }
    if (args.closesOn) {
      await page
        .locator('form[action$="/assessments/final"] input[name="closesOn"]')
        .fill(args.closesOn);
    }
    if (typeof args.passingThresholdPercent === "number") {
      await page
        .locator('form[action$="/assessments/final"] input[name="passingThresholdPercent"]')
        .fill(String(args.passingThresholdPercent));
    }
    await this.chooseQuestions(page, 'form[action$="/assessments/final"]', args.questionTexts);
    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.locator('form[action$="/assessments/final"] button[type="submit"]').click(),
    ]);
  }

  async getAssessmentId(teacher: User, course: Course, title: string): Promise<string> {
    const page = this.getPage(teacher);
    await this.openCourse(teacher, course);
    const href = await page.getByRole("link", { name: title }).getAttribute("href");
    const assessmentId = href?.split("/assessments/").at(1)?.split("/").at(0);
    if (!assessmentId) {
      throw new Error(`Assessment link missing for ${title}`);
    }
    return assessmentId;
  }

  async openAssessmentByRoute(args: {
    student: User;
    program: Program;
    course: Course;
    assessmentId: string;
  }): Promise<number> {
    const page = this.getPage(args.student);
    const response = await page.request.get(
      routes.programs
        .$(args.program.id)
        .courses.$(args.course.id)
        .assessments.$(args.assessmentId)
        .toString(),
      { maxRedirects: 0 },
    );

    return response.status();
  }

  async publishWeeklyTestWithQuestionIds(args: {
    teacher: User;
    course: Course;
    questionIds: string[];
  }): Promise<number> {
    const page = this.getPage(args.teacher);
    const response = await page.request.post(
      routes.programs.$(args.course.program.id).courses.$(args.course.id).assessments.$weekly,
      {
        form: {
          questionId: args.questionIds[0] ?? "",
        },
        maxRedirects: 0,
      },
    );

    return response.status();
  }

  async setCurrentDate(
    user: User,
    args: {
      isoDate?: string;
      advanceByDays?: number;
    },
  ): Promise<void> {
    const page = this.getPage(user);
    await page.request.post(routes.api.test.$setNow, {
      data: JSON.stringify(args),
    });
  }

  async resetCurrentDate(user: User): Promise<void> {
    const page = this.getPage(user);
    await page.request.post(routes.api.test.$resetNow);
  }

  async seesAssessmentAvailable(student: User, title: string): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.getByRole("link", { name: title }).count()) > 0;
  }

  async seesAssessmentUnavailable(student: User, title: string): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.getByRole("link", { name: title }).count()) === 0;
  }

  async openAssessment(student: User, title: string): Promise<void> {
    const page = this.getPage(student);
    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.getByRole("link", { name: title }).click(),
    ]);
  }

  async submitAssessmentAnswers(
    student: User,
    questions: Question[],
    mode: "correct" | "incorrect",
  ): Promise<void> {
    const page = this.getPage(student);
    for (const question of questions) {
      const option =
        mode === "correct"
          ? question.options.find((item) => item.isCorrect)
          : (question.options.find((item) => !item.isCorrect) ?? question.options[0]);
      if (!option) {
        continue;
      }

      await page.getByLabel(option.text).first().check();
    }

    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.getByRole("button", { name: "Submit Test" }).click(),
    ]);
  }

  async postCurrentAssessment(student: User): Promise<number> {
    const page = this.getPage(student);
    const response = await page.request.post(`${new URL(page.url()).pathname}/submit`, {
      form: {},
    });

    return response.status();
  }

  async seesAssessmentQuestions(student: User, questions: Question[]): Promise<boolean> {
    const page = this.getPage(student);
    for (const question of questions) {
      if ((await page.getByRole("group", { name: question.text }).count()) === 0) {
        return false;
      }
    }
    return true;
  }

  async seesAssessmentScore(student: User, scorePercent: number): Promise<boolean> {
    const page = this.getPage(student);
    const scoreText = await page.locator('output[name="assessment-score"]').textContent();
    return scoreText?.includes(String(scorePercent)) ?? false;
  }

  async seesAssessmentStatus(student: User, status: "passed" | "failed"): Promise<boolean> {
    const page = this.getPage(student);
    const text = await page.locator('output[name="assessment-status"]').textContent();
    return text?.includes(status) ?? false;
  }

  async seesRetryAvailableOn(student: User, isoDate: string): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.locator(`time[datetime="${isoDate}"]`).count()) > 0;
  }

  async seesCourseLink(student: User, course: Course): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.getByRole("link", { name: course.name }).count()) > 0;
  }

  private async publishAssessment(args: {
    teacher: User;
    course: Course;
    questionTexts?: string[];
    opensOn?: string;
    closesOn?: string;
    buttonName: string;
  }) {
    const page = this.getPage(args.teacher);
    const action =
      args.buttonName === "Publish Weekly Test"
        ? 'form[action$="/assessments/weekly"]'
        : 'form[action$="/assessments/final"]';
    await this.openCourse(args.teacher, args.course);

    if (args.opensOn) {
      await page.locator(`${action} input[name="opensOn"]`).fill(args.opensOn);
    }
    if (args.closesOn) {
      await page.locator(`${action} input[name="closesOn"]`).fill(args.closesOn);
    }
    await this.chooseQuestions(page, action, args.questionTexts);

    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.locator(`${action} button[type="submit"]`).click(),
    ]);
  }

  private async chooseQuestions(
    page: Awaited<ReturnType<PWDriver["getPage"]>>,
    formSelector: string,
    questionTexts?: string[],
  ) {
    if (!questionTexts) {
      return;
    }

    const checkboxes = page.locator(`${formSelector} input[name="questionId"]`);
    const count = await checkboxes.count();
    for (let index = 0; index < count; index++) {
      await checkboxes.nth(index).uncheck();
    }

    for (const questionText of questionTexts) {
      await page.locator(formSelector).getByLabel(questionText).check();
    }
  }
}
