import { routes } from "../../../../src/routes";
import type { Course, Lesson, Program, Textbook, User } from "../../dsl/types";
import type { ProgramDriver } from "../interface";
import { PWDriver } from "./base-driver";

type EnrollmentAction = "approve" | "reject";

export class PlaywrightProgramDriver extends PWDriver implements ProgramDriver {
  async createProgram(teacher: User): Promise<Program> {
    const page = this.getPage(teacher);

    if (!page.url().includes(routes.$programs)) {
      await page.goto(routes.$programs, { waitUntil: "domcontentloaded" });
    }

    // Generate random program name
    const programName = `Program ${crypto.randomUUID().slice(0, 8)}`;

    // Fill in program name and submit the form
    const form = page.locator(`form[method=post][action="${routes.$programs}"]`);

    await page.locator("summary", { hasText: "Create new program" }).click();
    await form.locator('input[name="name"]').fill(programName);
    await form.locator('button[type="submit"]').click();

    const link = page.locator(`a:has-text("${programName}")`);
    const href = await link.getAttribute("href");
    const id = href?.split("/").pop() ?? "";

    return {
      id,
      name: programName,
      teacher,
    };
  }

  async seesProgramOnDashboard(teacher: User, program: Program): Promise<boolean> {
    const page = this.getPage(teacher);

    await page.goto(routes.$programs, { waitUntil: "domcontentloaded" });

    // Check if the program name appears on the dashboard
    const programElement = page.locator(`text=${program.name}`);
    return (await programElement.count()) > 0;
  }

  async seesStudentEnrollmentDetails(
    teacher: User,
    student: User,
    program: Program,
  ): Promise<boolean> {
    const page = this.getPage(teacher);

    await page.goto(routes.$enrollments, {
      waitUntil: "domcontentloaded",
    });

    const enrollmentRow = page
      .locator("tr")
      .filter({ hasText: program.name })
      .filter({ hasText: student.email })
      .first();
    const text = await enrollmentRow.textContent();

    return (
      text?.includes(student.name) === true &&
      text.includes(student.email) &&
      text.includes(student.phone)
    );
  }

  async approveStudentEnrollment(teacher: User, student: User, program: Program): Promise<void> {
    await this.setStudentEnrollmentStatus(teacher, student, program, "approve");
  }

  async postStudentEnrollmentApproval(
    teacher: User,
    student: User,
    program: Program,
  ): Promise<number> {
    const page = this.getPage(teacher);
    const response = await page.request.post(
      routes.enrollments.$(program.id).enrollmentRequests.$(student.id).$approve,
      { maxRedirects: 0 },
    );

    return response.status();
  }

  async rejectStudentEnrollment(teacher: User, student: User, program: Program): Promise<void> {
    await this.setStudentEnrollmentStatus(teacher, student, program, "reject");
  }

  private async setStudentEnrollmentStatus(
    teacher: User,
    student: User,
    program: Program,
    action: EnrollmentAction,
  ): Promise<void> {
    const page = this.getPage(teacher);
    const requestRoute =
      action === "approve"
        ? routes.enrollments.$(program.id).enrollmentRequests.$(student.id).$approve
        : routes.enrollments.$(program.id).enrollmentRequests.$(student.id).$reject;

    await page.goto(routes.$enrollments, {
      waitUntil: "domcontentloaded",
    });

    await this.submitAndWaitForPath({
      action: () => page.locator(`button[formaction="${requestRoute}"]`).click(),
      page,
      pathname: routes.$enrollments,
      waitUntil: "networkidle",
    });
  }

  async getStudentEnrollmentStatusInProgram(
    teacher: User,
    student: User,
    program: Program,
  ): Promise<string | null> {
    const page = this.getPage(teacher);

    await page.goto(routes.$enrollments, {
      waitUntil: "domcontentloaded",
    });

    const row = page
      .locator("tbody tr")
      .filter({ hasText: program.name })
      .filter({ hasText: student.email })
      .first();
    if ((await row.count()) === 0) {
      return null;
    }

    const statusText = (await row.locator("td").nth(4).textContent())?.trim();
    return statusText === "active" ? "approved" : (statusText ?? null);
  }

  async getStudentEnrollmentStartDateInProgram(
    teacher: User,
    student: User,
    program: Program,
  ): Promise<string | null> {
    const page = this.getPage(teacher);

    await page.goto(routes.$enrollments);

    const enrollmentRow = page
      .locator("tbody tr")
      .filter({ hasText: program.name })
      .filter({ hasText: student.email })
      .first();
    return enrollmentRow.locator("time").getAttribute("datetime");
  }

  async addCourseToProgram(teacher: User, program: Program): Promise<Course> {
    const page = this.getPage(teacher);

    const programRoute = routes.programs.$(program.id);

    await page.goto(programRoute.toString(), { waitUntil: "domcontentloaded" });

    // Generate random course name
    const courseName = `Course ${crypto.randomUUID().slice(0, 8)}`;

    // Fill in program name and submit the form
    const form = page.locator(`form[method=post][action="${programRoute.$courses}"]`);
    const addCourseDetails = page.locator("details", { has: form });
    if (
      (await addCourseDetails.count()) > 0 &&
      !(await addCourseDetails.evaluate((el) => (el as HTMLDetailsElement).open))
    ) {
      await addCourseDetails.locator("summary").click();
    }
    await form.locator('input[name="name"]').fill(courseName);
    await form.locator('button[type="submit"]').click();

    const link = page.locator(`a:has-text("${courseName}")`);
    const href = await link.getAttribute("href");
    const id = href?.split("/").pop() ?? "";

    return {
      id,
      name: courseName,
      program,
    };
  }

  async seesCourseInProgram(teacher: User, program: Program, course: Course): Promise<boolean> {
    const page = this.getPage(teacher);

    const programRoute = routes.programs.$(program.id);

    await page.goto(programRoute.toString(), { waitUntil: "domcontentloaded" });

    const link = page.locator(`a[href="${programRoute.courses.$(course.id)}"]`);

    // Check if the course name appears in the program view
    return (await link.locator(`text=${course.name}`).count()) > 0;
  }

  async editProgramName(teacher: User, program: Program, newName: string): Promise<void> {
    const page = this.getPage(teacher);
    const programRoute = routes.programs.$(program.id);

    await page.goto(programRoute.toString(), { waitUntil: "domcontentloaded" });

    const form = page.locator(`form[method=post][action="${programRoute.$edit}"]`);
    await form.locator('input[name="name"]').fill(newName);
    await form.locator('button[type="submit"]').click();
  }

  async getProgramDetails(teacher: User, program: Program): Promise<Program> {
    const page = this.getPage(teacher);

    await page.goto(routes.programs.$(program.id).toString(), {
      waitUntil: "domcontentloaded",
    });
    const programName = await page.locator("main h1").textContent();

    return {
      id: program.id,
      name: programName?.trim() || "",
      teacher: program.teacher,
    };
  }

  async addTextbookToCourse(teacher: User, course: Course): Promise<Textbook> {
    const page = this.getPage(teacher);
    const courseRoute = routes.programs.$(course.program.id).courses.$(course.id);
    const title = `Textbook ${crypto.randomUUID().slice(0, 8)}`;
    const author = `Author ${crypto.randomUUID().slice(0, 6)}`;
    const description = `Description ${crypto.randomUUID().slice(0, 10)}`;

    await page.goto(courseRoute.toString(), { waitUntil: "domcontentloaded" });

    const form = page.locator(`form[method=post][action="${courseRoute.$textbook}"]`);
    await form.locator('input[name="title"]').fill(title);
    await form.locator('input[name="author"]').fill(author);
    await form.locator('textarea[name="description"]').fill(description);
    await form.locator('button[type="submit"]').click();

    return {
      id: "",
      title,
      author,
      description,
    };
  }

  async getCourseTextbook(teacher: User, course: Course): Promise<Textbook | null> {
    const page = this.getPage(teacher);
    const courseRoute = routes.programs.$(course.program.id).courses.$(course.id);

    await page.goto(courseRoute.toString(), { waitUntil: "domcontentloaded" });

    const section = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Textbook" }),
    });
    const title = await section.locator("dd").nth(0).textContent();
    const author = await section.locator("dd").nth(1).textContent();
    const description = await section.locator("dd").nth(2).textContent();

    if (!title || !author || !description) {
      return null;
    }

    return {
      id: "",
      title: title.trim(),
      author: author.replace("Author: ", "").trim(),
      description: description.trim(),
    };
  }

  async addLessonToCourse(teacher: User, course: Course): Promise<Lesson> {
    const page = this.getPage(teacher);

    const courseRoute = routes.programs.$(course.program.id).courses.$(course.id);

    await page.goto(courseRoute.toString(), { waitUntil: "domcontentloaded" });

    // Generate random lesson name
    const lessonName = `Lesson ${crypto.randomUUID().slice(0, 8)}`;

    // Fill in lesson name and submit the form
    const form = page.locator(`form[method=post][action="${courseRoute.$lessons}"]`);
    await form.locator('input[name="name"]').fill(lessonName);
    await this.submitAndWaitForPath({
      action: () => form.locator('input[name="name"]').press("Enter"),
      page,
      pathname: courseRoute.toString(),
    });

    const link = page.locator(`a:has-text("${lessonName}")`);
    const href = await link.getAttribute("href");
    const id = href?.split("/").pop() ?? "";

    return {
      id,
      name: lessonName,
      course,
    };
  }

  async reorderLessons(teacher: User, course: Course, lessonsInOrder: Lesson[]): Promise<void> {
    const page = this.getPage(teacher);
    const courseRoute = routes.programs.$(course.program.id).courses.$(course.id);

    await page.goto(courseRoute.toString(), { waitUntil: "domcontentloaded" });

    const form = page.locator(`form[method=post][action="${courseRoute.lessons.$reorder}"]`);

    for (const [index, lesson] of lessonsInOrder.entries()) {
      await form.locator(`input[name="lesson-position:${lesson.id}"]`).fill(String(index + 1));
    }

    await form.getByRole("button", { name: "Save Lesson Order" }).click();
  }

  async getCourseLessonNames(teacher: User, course: Course): Promise<string[]> {
    const page = this.getPage(teacher);
    const courseRoute = routes.programs.$(course.program.id).courses.$(course.id);

    await page.goto(courseRoute.toString(), { waitUntil: "domcontentloaded" });

    const section = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Lessons" }),
    });

    return section.locator("ol > li").evaluateAll((items) =>
      items.map((item) => {
        const lessonName = Array.from(item.children).find(
          (child) => child.tagName === "A" || child.tagName === "SPAN",
        );
        return lessonName?.textContent?.trim() ?? "";
      }),
    );
  }

  async seesLessonInCourse(teacher: User, lesson: Lesson): Promise<boolean> {
    const page = this.getPage(teacher);

    const course = lesson.course;
    const courseRoute = routes.programs.$(course.program.id).courses.$(course.id);

    await page.goto(courseRoute.toString(), { waitUntil: "domcontentloaded" });

    // Check if the lesson name appears on the current page (using contains selector)
    const lessonElement = page.locator(`a[href="${courseRoute.lessons.$(lesson.id)}"]`);

    return (await lessonElement.count()) > 0;
  }

  async removeLesson(teacher: User, lesson: Lesson): Promise<void> {
    const page = this.getPage(teacher);

    const course = lesson.course;
    const courseRoute = routes.programs.$(course.program.id).courses.$(course.id);

    await page.goto(courseRoute.toString(), { waitUntil: "domcontentloaded" });

    const removeLessonButton = page.locator(
      `button[formaction="${courseRoute.lessons.$(lesson.id).$delete}"]`,
    );

    await removeLessonButton.click();
  }

  async renameLesson(teacher: User, lesson: Lesson, newName: string): Promise<void> {
    const page = this.getPage(teacher);

    const course = lesson.course;
    const lessonRoute = routes.programs
      .$(course.program.id)
      .courses.$(course.id)
      .lessons.$(lesson.id).$edit;

    await page.goto(lessonRoute, { waitUntil: "domcontentloaded" });

    const form = page.locator("main form");
    // Fill in new lesson name and submit
    await form.locator('input[name="name"]').fill(newName);
    await form.locator('button[type="submit"]').first().click();
  }

  async setLessonVideoUrl(teacher: User, lesson: Lesson, videoUrl: string): Promise<void> {
    const page = this.getPage(teacher);
    const lessonRoute = routes.programs
      .$(lesson.course.program.id)
      .courses.$(lesson.course.id)
      .lessons.$(lesson.id).$edit;

    await page.goto(lessonRoute, { waitUntil: "domcontentloaded" });

    const form = page.locator("main form");
    await form.locator('input[name="videoUrl"]').fill(videoUrl);
    await form.locator('button[type="submit"]').first().click();
  }

  async getLessonDetails(teacher: User, lesson: Lesson): Promise<Lesson> {
    const page = this.getPage(teacher);

    const course = lesson.course;
    const courseRoute = routes.programs.$(course.program.id).courses.$(course.id);

    // Navigate to the course page where lessons are listed
    await page.goto(courseRoute.toString(), { waitUntil: "domcontentloaded" });

    // Find the lesson link by href and extract its text content
    const lessonLink = page
      .locator(`a[href="${courseRoute.lessons.$(lesson.id).toString()}"]`)
      .first();
    const lessonName = await lessonLink.textContent();

    return {
      id: lesson.id,
      name: lessonName?.trim() || "",
      course: lesson.course,
    };
  }

  async removeCourse(teacher: User, course: Course): Promise<void> {
    const page = this.getPage(teacher);

    const courseRoute = routes.programs.$(course.program.id).courses.$(course.id);

    await page.goto(courseRoute.toString(), { waitUntil: "domcontentloaded" });

    const removeCourseButton = page.locator(
      `form[action="${courseRoute.$delete}"] button[type="submit"]`,
    );

    await removeCourseButton.click();
  }
}
