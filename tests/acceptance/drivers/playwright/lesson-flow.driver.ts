import { routes } from "../../../../src/routes";
import type { Lesson, Program, Question, User } from "../../dsl/types";
import type { LessonFlowDriver } from "../interface";
import { PWDriver } from "./base-driver";

export class PlaywrightLessonFlowDriver extends PWDriver implements LessonFlowDriver {
  async openLesson(student: User, program: Program, lesson: Lesson): Promise<void> {
    const page = this.getPage(student);

    await page.goto(
      routes.programs.$(program.id).courses.$(lesson.course.id).lessons.$(lesson.id).toString(),
      {
        waitUntil: "domcontentloaded",
      },
    );
  }

  async completeLesson(student: User, program: Program, lesson: Lesson): Promise<void> {
    const page = this.getPage(student);
    const courseRoute = routes.programs.$(program.id).courses.$(lesson.course.id);

    await this.openLesson(student, program, lesson);
    await this.submitAndWaitForPath({
      action: () =>
        page
          .locator(
            `form[action="${courseRoute.lessons.$(lesson.id).$complete}"] button[type="submit"]`,
          )
          .click(),
      page,
      pathname: courseRoute.toString(),
      waitUntil: "networkidle",
    });
  }

  async markLessonListened(student: User, program: Program, lesson: Lesson): Promise<void> {
    const page = this.getPage(student);
    const lessonRoute = routes.programs
      .$(program.id)
      .courses.$(lesson.course.id)
      .lessons.$(lesson.id)
      .toString();

    await this.openLesson(student, program, lesson);
    await this.submitAndWaitForPath({
      action: () => page.getByRole("button", { name: "I have listened to this lesson" }).click(),
      page,
      pathname: lessonRoute,
    });
  }

  async submitCorrectLessonAnswers(
    student: User,
    program: Program,
    lesson: Lesson,
    question: Question,
  ): Promise<void> {
    const page = this.getPage(student);
    const lessonRoute = routes.programs
      .$(program.id)
      .courses.$(lesson.course.id)
      .lessons.$(lesson.id)
      .toString();
    const correctAnswer = question.options.find((option) => option.isCorrect);

    if (!correctAnswer) {
      throw new Error("Question has no correct answer");
    }

    await this.submitAndWaitForPath({
      action: () =>
        page
          .getByLabel(correctAnswer.text)
          .click()
          .then(() => page.getByRole("button", { name: "Submit Answers" }).click()),
      page,
      pathname: lessonRoute,
    });
  }

  async postLessonListened(student: User, program: Program, lesson: Lesson): Promise<number> {
    const page = this.getPage(student);
    const response = await page.request.post(
      routes.programs.$(program.id).courses.$(lesson.course.id).lessons.$(lesson.id).$complete,
    );

    return response.status();
  }

  async postLessonAnswers(student: User, program: Program, lesson: Lesson): Promise<number> {
    const page = this.getPage(student);
    const response = await page.request.post(
      routes.programs.$(program.id).courses.$(lesson.course.id).lessons.$(lesson.id).$answers,
      { form: {} },
    );

    return response.status();
  }

  async seesSubmittedAnswer(student: User, question: Question): Promise<boolean> {
    const page = this.getPage(student);
    const correctAnswer = question.options.find((option) => option.isCorrect);

    if (!correctAnswer) {
      return false;
    }

    return page.getByLabel(correctAnswer.text).isChecked();
  }

  async seesAnswerFeedback(student: User, _question: Question): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.getByText("Correct", { exact: true }).count()) > 0;
  }

  async seesAnswersLocked(student: User): Promise<boolean> {
    const page = this.getPage(student);
    const hasSubmitButton =
      (await page.getByRole("button", { name: "Submit Answers" }).count()) > 0;
    const enabledInputs = await page
      .locator('form[action$="/answers"] input:not([disabled])')
      .count();

    return !hasSubmitButton && enabledInputs === 0;
  }

  async openEnrolledProgram(student: User, program: Program): Promise<void> {
    const page = this.getPage(student);

    await page.goto(routes.programs.$(program.id).toString(), {
      waitUntil: "domcontentloaded",
    });
  }

  async seesLessonVideo(student: User, lesson: Lesson): Promise<boolean> {
    const page = this.getPage(student);

    return (await page.locator(`iframe[title="${lesson.name}"]`).count()) > 0;
  }

  async seesListenedPrompt(student: User): Promise<boolean> {
    const page = this.getPage(student);

    return (await page.getByRole("button", { name: "I have listened to this lesson" }).count()) > 0;
  }

  async seesQuestionHidden(student: User, question: Question): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.getByRole("group", { name: question.text }).count()) === 0;
  }

  async seesQuestionVisible(student: User, question: Question): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.getByRole("group", { name: question.text }).count()) > 0;
  }

  async seesLessonMarkedListened(student: User): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.getByText("Lesson status: Listened").count()) > 0;
  }

  async seesLessonMarkedCompletedOnPage(student: User): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.getByText("Lesson status: Completed").count()) > 0;
  }

  async seesAvailableLesson(student: User, program: Program, lesson: Lesson): Promise<boolean> {
    const page = this.getPage(student);

    return (
      (await page
        .locator(
          `a[href="${routes.programs.$(program.id).courses.$(lesson.course.id).lessons.$(lesson.id).toString()}"]`,
        )
        .count()) > 0
    );
  }

  async seesLockedLesson(student: User, program: Program, lesson: Lesson): Promise<boolean> {
    const page = this.getPage(student);

    const lessonItem = page.locator("li").filter({ hasText: lesson.name }).first();

    return (await lessonItem.locator("text=Locked").count()) > 0;
  }

  async seesCompletedLesson(student: User, program: Program, lesson: Lesson): Promise<boolean> {
    const page = this.getPage(student);

    const lessonItem = page.locator("li").filter({ hasText: lesson.name }).first();

    return (await lessonItem.locator("text=Completed").count()) > 0;
  }

  async seesLessonUnavailable(student: User): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.getByText("Lesson not found", { exact: true }).count()) > 0;
  }
}
