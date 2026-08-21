import type { Page } from "playwright";
import { questionEditorIntents } from "../../../../src/features/question-editor-actions";
import { routes } from "../../../../src/routes";
import { FORM_ELEMENTS } from "../../../../src/ui/organisms/test-maker/test-maker-form-elements";
import type { Lesson, Question, QuestionOption, User } from "../../dsl/types";
import type { QuestionDriver } from "../interface";
import { PWDriver } from "./base-driver";

export class PlaywrightQuestionDriver extends PWDriver implements QuestionDriver {
  private getLessonPath(lesson: Lesson) {
    return routes.programs
      .$(lesson.course.program.id)
      .courses.$(lesson.course.id)
      .lessons.$(lesson.id)
      .toString();
  }

  private getLessonQuestionsPath(lesson: Lesson) {
    return routes.programs
      .$(lesson.course.program.id)
      .courses.$(lesson.course.id)
      .lessons.$(lesson.id)
      .toString();
  }

  private questionActionButton(intent: string) {
    return `button[name="${FORM_ELEMENTS.questionAction}"][value="${intent}"]`;
  }

  private async gotoLessonEditor(teacher: User, lesson: Lesson) {
    const page = this.getPage(teacher);

    await page.goto(this.getLessonPath(lesson));

    return page;
  }

  private async saveQuestions(page: Page, lesson: Lesson) {
    const form = page.locator(`form[action="${this.getLessonQuestionsPath(lesson)}"]`);

    await this.submitAndWaitForPath({
      action: () => form.getByRole("button", { name: "Sačuvaj" }).click(),
      page,
      pathname: this.getLessonPath(lesson),
    });
  }

  private async submitEditorIntent(page: Page, lesson: Lesson, action: () => Promise<unknown>) {
    await Promise.all([
      page.waitForURL((url) => url.pathname === this.getLessonPath(lesson), {
        waitUntil: "domcontentloaded",
      }),
      action(),
    ]);
  }

  private async addQuestion(
    teacher: User,
    lesson: Lesson,
    args: {
      type: Question["type"];
      options: QuestionOption[];
      rows?: string[];
    },
  ): Promise<Question> {
    const page = await this.gotoLessonEditor(teacher, lesson);

    const addQuestionButton = page.locator(
      this.questionActionButton(questionEditorIntents.addQuestion),
    );

    await this.submitEditorIntent(page, lesson, () => addQuestionButton.click());

    const questionText = `Question ${crypto.randomUUID().slice(0, 8)}?`;
    let newQuestion = page.locator('fieldset[name="question"]').last();
    const questionIndex = (await page.locator('fieldset[name="question"]').count()) - 1;
    const isGrid =
      args.type === FORM_ELEMENTS.answerType.radioGrid ||
      args.type === FORM_ELEMENTS.answerType.checkboxGrid;

    const typeButton = newQuestion.locator(
      this.questionActionButton(questionEditorIntents.applyQuestion(questionIndex, args.type)),
    );
    await this.submitEditorIntent(page, lesson, () => typeButton.click());
    newQuestion = page.locator('fieldset[name="question"]').last();

    await newQuestion.locator('input[name^="q-"][name$="-text"]').fill(questionText);

    await newQuestion.locator('input[name$="-answer-0"]').waitFor();

    for (let i = 2; i < args.options.length; i++) {
      await this.submitEditorIntent(page, lesson, () =>
        newQuestion
          .locator(
            `fieldset[name="${FORM_ELEMENTS.answers}"] > ${this.questionActionButton(
              questionEditorIntents.addAnswer(questionIndex),
            )}`,
          )
          .click(),
      );
      newQuestion = page.locator('fieldset[name="question"]').last();
    }

    for (let i = 0; i < args.options.length; i++) {
      const option = args.options[i];
      if (!option) continue;
      await newQuestion.locator(`input[name$="-answer-${i}"]`).fill(option.text);
      if (option.isCorrect && !isGrid) {
        await newQuestion.locator(`input[name$="-answer"][value="${i}"]`).check();
      }
    }

    if (args.rows) {
      for (let i = 1; i < args.rows.length; i++) {
        await this.submitEditorIntent(page, lesson, () =>
          newQuestion
            .locator(
              `fieldset[name="${FORM_ELEMENTS.subQuestions}"] > ${this.questionActionButton(
                questionEditorIntents.addRow(questionIndex),
              )}`,
            )
            .click(),
        );
        newQuestion = page.locator('fieldset[name="question"]').last();
      }

      for (let i = 0; i < args.rows.length; i++) {
        const row = args.rows[i];
        if (!row) continue;
        await newQuestion.locator(`input[name$="-subQuestion-${i}"]`).fill(row);
      }
    }

    if (isGrid) {
      await this.submitEditorIntent(page, lesson, () =>
        newQuestion
          .locator(this.questionActionButton(questionEditorIntents.openAnswerKey(questionIndex)))
          .click(),
      );
      newQuestion = page.locator('fieldset[name="question"]').last();

      for (const [optionIndex, option] of args.options.entries()) {
        const correctRows =
          option?.correctRows ??
          (option?.isCorrect ? (args.rows ?? []).map((_, index) => index) : []);

        for (const rowIndex of correctRows) {
          await newQuestion
            .locator(
              `input[name="${FORM_ELEMENTS.naming.qGridAnswer(
                questionIndex,
                rowIndex,
              )}"][value="${optionIndex}"]`,
            )
            .check();
        }
      }
    }

    await this.saveQuestions(page, lesson);

    return {
      id: crypto.randomUUID(),
      text: questionText,
      type: args.type,
      options: args.options,
      rows: args.rows,
      lesson,
    };
  }

  async addSingleAnswerQuestion(
    teacher: User,
    lesson: Lesson,
    options: QuestionOption[],
  ): Promise<Question> {
    return this.addQuestion(teacher, lesson, {
      type: FORM_ELEMENTS.answerType.radio,
      options,
    });
  }

  async addRadioGridQuestion(
    teacher: User,
    lesson: Lesson,
    options: QuestionOption[],
    rows: string[],
  ): Promise<Question> {
    return this.addQuestion(teacher, lesson, {
      type: FORM_ELEMENTS.answerType.radioGrid,
      options,
      rows,
    });
  }

  async addCheckboxGridQuestion(
    teacher: User,
    lesson: Lesson,
    options: QuestionOption[],
    rows: string[],
  ): Promise<Question> {
    return this.addQuestion(teacher, lesson, {
      type: FORM_ELEMENTS.answerType.checkboxGrid,
      options,
      rows,
    });
  }

  async addMultipleAnswerQuestion(
    teacher: User,
    lesson: Lesson,
    options: QuestionOption[],
  ): Promise<Question> {
    return this.addQuestion(teacher, lesson, {
      type: FORM_ELEMENTS.answerType.checkbox,
      options,
    });
  }

  async seeQuestionWithMarkedAnswer(
    teacher: User,
    lesson: Lesson,
    question: Question,
  ): Promise<boolean> {
    // Delegate to seesQuestions for comprehensive verification
    return this.seesQuestions(teacher, lesson, [question]);
  }

  async removeQuestion(teacher: User, lesson: Lesson, question: Question): Promise<void> {
    const page = await this.gotoLessonEditor(teacher, lesson);

    await page.waitForLoadState("networkidle");

    const questionFieldsets = page.locator('fieldset[name="question"]');
    const questionCount = await questionFieldsets.count();
    let questionRemoved = false;

    for (let index = 0; index < questionCount; index++) {
      const questionFieldset = questionFieldsets.nth(index);
      const questionText = await questionFieldset
        .locator('input[name^="q-"][name$="-text"]')
        .inputValue();

      if (questionText === question.text) {
        await this.submitEditorIntent(page, lesson, () =>
          questionFieldset
            .locator(this.questionActionButton(questionEditorIntents.removeQuestion(index)))
            .click(),
        );
        questionRemoved = true;
        break;
      }
    }

    if (!questionRemoved) {
      throw new Error(`Question not found: ${question.text}`);
    }

    await this.saveQuestions(page, lesson);
  }

  async reorderQuestions(
    teacher: User,
    lesson: Lesson,
    questionsInOrder: Question[],
  ): Promise<void> {
    const page = await this.gotoLessonEditor(teacher, lesson);
    const questionFieldsets = page.locator('questions-maker > fieldset[name="question"]');

    for (const [targetIndex, question] of questionsInOrder.entries()) {
      while (true) {
        const currentQuestions = await questionFieldsets.evaluateAll((elements) =>
          elements.map(
            (element) =>
              (element.querySelector(`input[name$="-text"]`) as HTMLInputElement | null)?.value ??
              "",
          ),
        );
        const currentIndex = currentQuestions.indexOf(question.text);
        if (currentIndex === -1) {
          throw new Error(`Question not found: ${question.text}`);
        }
        if (currentIndex === targetIndex) {
          break;
        }

        const intent =
          currentIndex > targetIndex
            ? questionEditorIntents.moveQuestionUp(currentIndex)
            : questionEditorIntents.moveQuestionDown(currentIndex);
        await this.submitEditorIntent(page, lesson, () =>
          questionFieldsets.nth(currentIndex).locator(this.questionActionButton(intent)).click(),
        );
      }
    }

    await this.saveQuestions(page, lesson);
  }

  async moveLastQuestionDown(teacher: User, lesson: Lesson): Promise<void> {
    const page = await this.gotoLessonEditor(teacher, lesson);
    const questionFieldsets = page.locator('questions-maker > fieldset[name="question"]');
    const lastIndex = (await questionFieldsets.count()) - 1;

    await this.submitEditorIntent(page, lesson, () =>
      questionFieldsets
        .nth(lastIndex)
        .locator(this.questionActionButton(questionEditorIntents.moveQuestionDown(lastIndex)))
        .click(),
    );

    await this.saveQuestions(page, lesson);
  }

  async moveFirstQuestionUp(teacher: User, lesson: Lesson): Promise<void> {
    const page = await this.gotoLessonEditor(teacher, lesson);
    const questionFieldsets = page.locator('questions-maker > fieldset[name="question"]');

    await this.submitEditorIntent(page, lesson, () =>
      questionFieldsets
        .first()
        .locator(this.questionActionButton(questionEditorIntents.moveQuestionUp(0)))
        .click(),
    );

    await this.saveQuestions(page, lesson);
  }

  async seesQuestions(teacher: User, lesson: Lesson, questions: Question[]): Promise<boolean> {
    const page = await this.gotoLessonEditor(teacher, lesson);

    // Verify we have exactly the right number of questions
    const allQuestions = page.locator('fieldset[name="question"]');
    const totalCount = await allQuestions.count();

    if (totalCount !== questions.length) {
      return false;
    }

    // Verify each question in detail
    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const question = questions[qIdx];
      if (!question) continue;

      // Verify question text
      const questionInput = page.locator(`input[name="${FORM_ELEMENTS.naming.qText(qIdx)}"]`);
      const questionText = await questionInput.inputValue();

      if (questionText !== question.text) {
        return false;
      }

      const typeField = page.locator(
        `input[type="hidden"][name="${FORM_ELEMENTS.naming.qType(qIdx)}"]`,
      );
      const selectedType = await typeField.inputValue();

      if (selectedType !== question.type) {
        return false;
      }
      const isGrid =
        question.type === FORM_ELEMENTS.answerType.radioGrid ||
        question.type === FORM_ELEMENTS.answerType.checkboxGrid;

      // Verify all answer options
      for (let i = 0; i < question.options.length; i++) {
        const option = question.options[i];
        if (!option) continue;

        // Check answer text input
        const answerTextInput = page.locator(
          `input[name="${FORM_ELEMENTS.naming.qAnswerText(qIdx, i)}"]`,
        );
        const answerText = await answerTextInput.inputValue();

        if (answerText !== option.text) {
          return false;
        }

        if (!isGrid) {
          // Check if correct answer is marked (checked)
          const answerInput = page.locator(
            `input[name="${FORM_ELEMENTS.naming.qAnswer(qIdx)}"][value="${i}"]`,
          );
          const isChecked = await answerInput.isChecked();

          if (isChecked !== option.isCorrect) {
            return false;
          }
        }
      }

      const rows = question.rows ?? [];
      const rowInputs = page.locator(`input[name^="q-${qIdx}-subQuestion-"]`);
      if ((await rowInputs.count()) !== rows.length) {
        return false;
      }
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const expectedRow = rows[rowIdx];
        if (!expectedRow) continue;
        const actualRow = await page
          .locator(`input[name="${FORM_ELEMENTS.naming.qSubQuestionText(qIdx, rowIdx)}"]`)
          .inputValue();
        if (actualRow !== expectedRow) {
          return false;
        }
      }

      if (isGrid) {
        for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
          for (let optionIdx = 0; optionIdx < question.options.length; optionIdx++) {
            const option = question.options[optionIdx];
            if (!option) continue;
            const answerKeyInput = page.locator(
              `input[type="hidden"][name="${FORM_ELEMENTS.naming.qGridAnswer(
                qIdx,
                rowIdx,
              )}"][value="${optionIdx}"]`,
            );
            const isCorrect = (await answerKeyInput.count()) > 0;
            const expectedCorrectRows =
              option.correctRows ?? (option.isCorrect ? rows.map((_, index) => index) : []);
            const expectedIsCorrect = expectedCorrectRows.includes(rowIdx);

            if (isCorrect !== expectedIsCorrect) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }
}
