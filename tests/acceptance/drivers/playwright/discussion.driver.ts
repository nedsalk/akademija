import { routes } from "../../../../src/routes";
import type { Lesson, User } from "../../dsl/types";
import type { DiscussionDriver } from "../interface";
import { PWDriver } from "./base-driver";

export class PlaywrightDiscussionDriver extends PWDriver implements DiscussionDriver {
  async submitQuestion(student: User, body: string): Promise<void> {
    const page = this.getPage(student);
    await page.locator('textarea[name="body"]').first().fill(body);
    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.getByRole("button", { name: "Submit Question" }).click(),
    ]);
  }

  async openLesson(teacher: User, lesson: Lesson): Promise<void> {
    const page = this.getPage(teacher);
    await page.goto(
      routes.programs
        .$(lesson.course.program.id)
        .courses.$(lesson.course.id)
        .lessons.$(lesson.id)
        .toString(),
      { waitUntil: "domcontentloaded" },
    );
  }

  async approveDiscussion(teacher: User, discussionBody: string): Promise<void> {
    const page = this.getPage(teacher);
    const item = page.locator("li").filter({ hasText: discussionBody }).last();
    await Promise.all([
      page.waitForLoadState("networkidle"),
      item.getByRole("button", { name: "Approve" }).click(),
    ]);
  }

  async getDiscussionId(teacher: User, lesson: Lesson, discussionBody: string): Promise<string> {
    const page = this.getPage(teacher);
    await this.openLesson(teacher, lesson);
    const item = page.locator("li").filter({ hasText: discussionBody }).last();
    const approveButton = item.getByRole("button", { name: "Approve" });
    const action =
      (await approveButton.count()) > 0
        ? await approveButton.getAttribute("formaction")
        : await item
            .locator('form[action*="/discussions/"][action$="/reply"]')
            .first()
            .getAttribute("action");
    const discussionId = action?.split("/discussions/").at(1)?.split("/").at(0);
    if (!discussionId) {
      throw new Error(`Discussion id missing for ${discussionBody}`);
    }
    return discussionId;
  }

  async postQuestion(student: User, lesson: Lesson, body: string): Promise<number> {
    const page = this.getPage(student);
    const response = await page.request.post(
      routes.programs.$(lesson.course.program.id).courses.$(lesson.course.id).lessons.$(lesson.id)
        .$discussions,
      {
        form: { body },
        maxRedirects: 0,
      },
    );

    return response.status();
  }

  async postReply(args: {
    student: User;
    lesson: Lesson;
    discussionId: string;
    body: string;
  }): Promise<number> {
    const page = this.getPage(args.student);
    const response = await page.request.post(
      routes.programs
        .$(args.lesson.course.program.id)
        .courses.$(args.lesson.course.id)
        .lessons.$(args.lesson.id)
        .discussions.$(args.discussionId).$reply,
      {
        form: { body: args.body },
        maxRedirects: 0,
      },
    );

    return response.status();
  }

  async postApproval(args: {
    teacher: User;
    lesson: Lesson;
    discussionId: string;
  }): Promise<number> {
    const page = this.getPage(args.teacher);
    const response = await page.request.post(
      routes.programs
        .$(args.lesson.course.program.id)
        .courses.$(args.lesson.course.id)
        .lessons.$(args.lesson.id)
        .discussions.$(args.discussionId).$approve,
      { maxRedirects: 0 },
    );

    return response.status();
  }

  async submitReply(student: User, discussionBody: string, replyBody: string): Promise<void> {
    const page = this.getPage(student);
    const item = page.locator("li").filter({ hasText: discussionBody }).last();
    await item.locator('textarea[name="body"]').fill(replyBody);
    await Promise.all([
      page.waitForLoadState("networkidle"),
      item.getByRole("button", { name: "Submit Reply" }).click(),
    ]);
  }

  async submitTeacherReply(
    teacher: User,
    discussionBody: string,
    replyBody: string,
  ): Promise<void> {
    const page = this.getPage(teacher);
    const item = page.locator("li").filter({ hasText: discussionBody }).last();
    await item.locator('textarea[name="body"]').fill(replyBody);
    await Promise.all([
      page.waitForLoadState("networkidle"),
      item.getByRole("button", { name: "Submit Reply" }).click(),
    ]);
  }

  async seesPendingDiscussion(user: User, discussionBody: string): Promise<boolean> {
    const page = this.getPage(user);
    return (
      (await page
        .locator("li")
        .filter({ hasText: discussionBody })
        .filter({
          hasText: "pending",
        })
        .count()) > 0
    );
  }

  async seesDiscussionAuthor(
    teacher: User,
    discussionBody: string,
    student: User,
  ): Promise<boolean> {
    const page = this.getPage(teacher);
    const item = page.locator("li").filter({ hasText: discussionBody }).last();
    const text = await item.textContent();
    return text?.includes(student.name) ?? false;
  }

  async seesDiscussionHidden(student: User, discussionBody: string): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.getByText(discussionBody, { exact: true }).count()) === 0;
  }

  async seesApprovedDiscussionAnonymously(student: User, discussionBody: string): Promise<boolean> {
    const page = this.getPage(student);
    const item = page.locator("li").filter({ hasText: discussionBody }).last();
    const text = await item.textContent();
    return text?.includes("Student") ?? false;
  }

  async seesPendingReply(teacher: User, replyBody: string): Promise<boolean> {
    const page = this.getPage(teacher);
    return (
      (await page
        .locator("li")
        .filter({ hasText: replyBody })
        .filter({
          hasText: "pending",
        })
        .count()) > 0
    );
  }

  async seesReplyThreaded(
    student: User,
    discussionBody: string,
    replyBody: string,
  ): Promise<boolean> {
    const page = this.getPage(student);
    const item = page.locator("li").filter({ hasText: discussionBody }).last();
    const text = await item.textContent();
    return text?.includes(replyBody) ?? false;
  }

  async seesTeacherReplyThreaded(
    student: User,
    discussionBody: string,
    replyBody: string,
    teacher: User,
  ): Promise<boolean> {
    const page = this.getPage(student);
    const item = page.locator("li").filter({ hasText: discussionBody }).last();
    const text = await item.textContent();
    return text?.includes(replyBody) === true && text.includes(teacher.name);
  }
}
