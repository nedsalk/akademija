import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { HonoEnv } from "..";
import { db } from "../db";
import { lesson } from "../db/schema";
import { now } from "../domain/clock";
import { reorderLessons } from "../domain/content";
import {
  getLessonWithQuestions,
  getNextPosition,
  getOwnedCourse,
  getOwnedLesson,
} from "../features/catalog";
import {
  addLessonDiscussion,
  approveLessonDiscussion,
  filterStudentVisibleDiscussions,
  getLessonDiscussions,
} from "../features/discussions";
import { getLessonAnswerFeedback, getSavedLessonAnswers } from "../features/lesson-answers";
import {
  markLessonListened,
  openLessonForStudent,
  submitLessonAnswers,
} from "../features/lesson-progress-service";
import { notifyTeacherOfDiscussionQuestion } from "../features/notifications";
import { toQuestionEditorAction } from "../features/question-editor-actions";
import {
  applyQuestionEditorAction,
  getNextAnswerKeyQuestionIndex,
  parseQuestionForm,
  prepareQuestionSet,
  replaceLessonQuestions,
} from "../features/questions";
import { routes } from "../routes";
import { getNextTestMakerFocusTarget } from "../ui/organisms/test-maker/test-maker-focus";
import { FORM_ELEMENTS } from "../ui/organisms/test-maker/test-maker-form-elements";
import { LessonEditPage } from "../ui/programs/LessonEditPage";
import { LessonPage } from "../ui/programs/LessonPage";
import { LessonQuestionEditorPage } from "../ui/programs/LessonQuestionEditorPage";

const coursePath = routes.programs.$(":programId").courses.$(":courseId");
const lessonPath = coursePath.lessons.$(":lessonId");
const discussionPath = lessonPath.discussions.$(":discussionId");

function trimText(value: FormDataEntryValue | null) {
  return value?.toString().trim() ?? "";
}

function isYouTubeUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return ["youtube.com", "www.youtube.com", "youtu.be"].includes(url.hostname);
  } catch {
    return false;
  }
}

function parseLessonInput(formData: FormData) {
  const name = trimText(formData.get("name"));
  const videoUrl = trimText(formData.get("videoUrl"));

  if (!name) {
    return {
      ok: false as const,
      error: "Lesson name is required",
    };
  }

  if (!isYouTubeUrl(videoUrl)) {
    return {
      ok: false as const,
      error: "Lesson video URL must be a YouTube URL",
    };
  }

  return {
    ok: true as const,
    value: {
      name,
      videoUrl,
    },
  };
}

function toDiscussionItems(discussions: Awaited<ReturnType<typeof getLessonDiscussions>>) {
  return discussions.map((discussion) => ({
    authorName: discussion.authorName,
    authorRole: discussion.authorRole,
    body: discussion.body,
    id: discussion.id,
    replies: discussion.replies.map((reply) => ({
      authorName: reply.authorName,
      authorRole: reply.authorRole,
      body: reply.body,
      id: reply.id,
      replies: [],
      status: reply.status,
    })),
    status: discussion.status,
  }));
}

async function getStudentDiscussionLessonAccess(args: {
  courseId: string;
  lessonId: string;
  programId: string;
  studentId: string;
}) {
  const progress = await openLessonForStudent(args);
  if (!progress.ok) {
    return progress;
  }

  if (
    !progress.value.listenedLessonIds.has(args.lessonId) &&
    !progress.value.completedLessonIds.has(args.lessonId)
  ) {
    return { ok: false as const, error: "not-found" as const };
  }

  return progress;
}

export const lessonEndpoints = new Hono<HonoEnv>();

lessonEndpoints.post(coursePath.$lessons, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const currentCourse = await getOwnedCourse(currentUser.id, programId, courseId);
  if (!currentCourse) {
    return c.text("Course not found", 404);
  }

  const formData = await c.req.formData();
  const lessonInput = parseLessonInput(formData);
  if (!lessonInput.ok) {
    return c.text(lessonInput.error, 400);
  }

  const currentTime = now();
  await db.insert(lesson).values({
    ...lessonInput.value,
    position: await getNextPosition(lesson, lesson.position, lesson.courseId, courseId),
    courseId,
    createdAt: currentTime,
    updatedAt: currentTime,
  });

  return c.redirect(routes.programs.$(programId).courses.$(courseId).toString());
});

lessonEndpoints.post(coursePath.lessons.$reorder, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const currentCourse = await getOwnedCourse(currentUser.id, programId, courseId);
  if (!currentCourse) {
    return c.text("Course not found", 404);
  }

  const lessons = await db
    .select()
    .from(lesson)
    .where(eq(lesson.courseId, courseId))
    .orderBy(asc(lesson.position));
  const formData = await c.req.formData();

  const rankedLessons = reorderLessons(
    lessons.map((lessonItem) => ({
      id: lessonItem.id,
      submittedPosition: Number(
        formData.get(`lesson-position:${lessonItem.id}`)?.toString() ?? lessonItem.position + 1,
      ),
      currentPosition: lessonItem.position,
    })),
  );

  if (!rankedLessons.ok) {
    return c.text(rankedLessons.error, 400);
  }

  await Promise.all(
    rankedLessons.value.map((lessonItem) =>
      db
        .update(lesson)
        .set({
          position: lessonItem.position,
          updatedAt: now(),
        })
        .where(eq(lesson.id, lessonItem.id)),
    ),
  );

  return c.redirect(routes.programs.$(programId).courses.$(courseId).toString());
});

lessonEndpoints.post(lessonPath.$delete, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId") as string;
  const courseId = c.req.param("courseId") as string;
  const lessonId = c.req.param("lessonId") as string;
  const currentLesson = await getOwnedLesson(currentUser.id, programId, courseId, lessonId);
  if (!currentLesson) {
    return c.text("Lesson not found", 404);
  }

  await db.delete(lesson).where(eq(lesson.id, lessonId));
  return c.redirect(routes.programs.$(programId).courses.$(courseId).toString());
});

lessonEndpoints.get(lessonPath.$edit, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const currentLesson = await getOwnedLesson(
    currentUser.id,
    c.req.param("programId"),
    c.req.param("courseId"),
    c.req.param("lessonId"),
  );
  if (!currentLesson) {
    return c.text("Lesson not found", 404);
  }

  return c.render(
    <LessonEditPage
      courseId={c.req.param("courseId")}
      lessonId={c.req.param("lessonId")}
      name={currentLesson.name}
      programId={c.req.param("programId")}
      videoUrl={currentLesson.videoUrl}
    />,
  );
});

lessonEndpoints.post(lessonPath.$edit, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const lessonId = c.req.param("lessonId");
  const currentLesson = await getOwnedLesson(currentUser.id, programId, courseId, lessonId);
  if (!currentLesson) {
    return c.text("Lesson not found", 404);
  }

  const formData = await c.req.formData();
  const lessonInput = parseLessonInput(formData);
  if (!lessonInput.ok) {
    return c.text(lessonInput.error, 400);
  }

  await db
    .update(lesson)
    .set({
      ...lessonInput.value,
      updatedAt: now(),
    })
    .where(eq(lesson.id, lessonId));

  return c.redirect(routes.programs.$(programId).courses.$(courseId).toString());
});

lessonEndpoints.post(lessonPath.toString(), async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId") as string;
  const courseId = c.req.param("courseId") as string;
  const lessonId = c.req.param("lessonId") as string;
  const currentLesson = await getOwnedLesson(currentUser.id, programId, courseId, lessonId);
  if (!currentLesson) {
    return c.text("Lesson not found", 404);
  }

  const formData = await c.req.formData();
  const action = toQuestionEditorAction(formData.get(FORM_ELEMENTS.questionAction)?.toString());
  if (!action) {
    const drafts = parseQuestionForm(formData);
    const questionSet = prepareQuestionSet(drafts);
    if (!questionSet.ok) {
      return c.text(questionSet.error, 400);
    }

    await replaceLessonQuestions(lessonId, questionSet.value);
    return c.redirect(
      routes.programs.$(programId).courses.$(courseId).lessons.$(lessonId).toString(),
    );
  }

  const drafts = parseQuestionForm(formData, { preserveEmpty: true });
  const focusTarget = getNextTestMakerFocusTarget(drafts, action);
  const questions = applyQuestionEditorAction(drafts, action);
  const submittedAnswerKeyQuestionIndexValue = formData
    .get(FORM_ELEMENTS.answerKeyQuestionIndex)
    ?.toString();
  const submittedAnswerKeyQuestionIndex =
    submittedAnswerKeyQuestionIndexValue === undefined ||
    !/^\d+$/.test(submittedAnswerKeyQuestionIndexValue)
      ? undefined
      : Number(submittedAnswerKeyQuestionIndexValue);
  const answerKeyQuestionIndex = getNextAnswerKeyQuestionIndex(
    drafts,
    action,
    submittedAnswerKeyQuestionIndex,
  );
  const discussions = await getLessonDiscussions(lessonId);

  return c.render(
    <LessonQuestionEditorPage
      answerKeyQuestionIndex={answerKeyQuestionIndex}
      courseId={courseId}
      discussions={toDiscussionItems(discussions)}
      focusTarget={focusTarget}
      lessonId={lessonId}
      lessonName={currentLesson.name}
      programId={programId}
      questions={questions}
    />,
    { cssTemplate: "teacher-lesson-template" },
  );
});

lessonEndpoints.post(lessonPath.$questions, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const lessonId = c.req.param("lessonId");
  const currentLesson = await getOwnedLesson(currentUser.id, programId, courseId, lessonId);
  if (!currentLesson) {
    return c.text("Lesson not found", 404);
  }

  const formData = await c.req.formData();
  const drafts = parseQuestionForm(formData);
  const questionSet = prepareQuestionSet(drafts);
  if (!questionSet.ok) {
    return c.text(questionSet.error, 400);
  }

  await replaceLessonQuestions(lessonId, questionSet.value);
  return c.redirect(
    routes.programs.$(programId).courses.$(courseId).lessons.$(lessonId).toString(),
  );
});

lessonEndpoints.get(lessonPath.toString(), async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const lessonState = await getLessonWithQuestions(c.req.param("lessonId"));
  if (
    !lessonState ||
    lessonState.course.id !== c.req.param("courseId") ||
    lessonState.program.id !== c.req.param("programId")
  ) {
    return c.text("Lesson not found", 404);
  }

  const canManageLesson =
    lessonState.program.teacherId === currentUser.id &&
    (currentUser.role === "teacher" || currentUser.role === "admin");

  if (canManageLesson) {
    const discussions = await getLessonDiscussions(lessonState.lesson.id);
    return c.render(
      <LessonQuestionEditorPage
        courseId={lessonState.course.id}
        discussions={toDiscussionItems(discussions)}
        lessonId={lessonState.lesson.id}
        lessonName={lessonState.lesson.name}
        programId={lessonState.program.id}
        questions={lessonState.questions.map((questionItem) => ({
          options: questionItem.options.map((option) => ({
            correctRows: option.correctRows,
            isCorrect: option.isCorrect,
            text: option.text,
          })),
          rows: questionItem.rows.map((row) => row.text),
          text: questionItem.text,
          type: questionItem.type,
        }))}
      />,
      { cssTemplate: "teacher-lesson-template" },
    );
  }

  if (currentUser.role !== "student") {
    return c.text("Lesson not found", 404);
  }

  const progress = await openLessonForStudent({
    studentId: currentUser.id,
    programId: lessonState.program.id,
    courseId: lessonState.course.id,
    lessonId: lessonState.lesson.id,
  });
  if (!progress.ok) {
    return c.text("Lesson not found", 404);
  }

  const completedLessonIds = progress.value.completedLessonIds;
  const listenedLesson = progress.value.listenedLessonIds.has(lessonState.lesson.id);
  const lessonIsCompleted = completedLessonIds.has(lessonState.lesson.id);
  const savedAnswers = await getSavedLessonAnswers(currentUser.id, lessonState.lesson.id);
  const discussions = filterStudentVisibleDiscussions(
    await getLessonDiscussions(lessonState.lesson.id),
    currentUser.id,
  );

  return c.render(
    <LessonPage
      answerAction={
        routes.programs
          .$(lessonState.program.id)
          .courses.$(lessonState.course.id)
          .lessons.$(lessonState.lesson.id).$answers
      }
      completeAction={
        routes.programs
          .$(lessonState.program.id)
          .courses.$(lessonState.course.id)
          .lessons.$(lessonState.lesson.id).$complete
      }
      courseId={lessonState.course.id}
      discussionAction={
        routes.programs
          .$(lessonState.program.id)
          .courses.$(lessonState.course.id)
          .lessons.$(lessonState.lesson.id).$discussions
      }
      discussions={discussions.map((discussion) => ({
        authorLabel: discussion.authorRole === "teacher" ? discussion.authorName : "Student",
        body: discussion.body,
        id: discussion.id,
        replies: discussion.replies.map((reply) => ({
          authorLabel: reply.authorRole === "teacher" ? reply.authorName : "Student",
          body: reply.body,
          id: reply.id,
          replies: [],
          status: reply.status,
        })),
        status: discussion.status,
      }))}
      feedbackByQuestionId={
        lessonIsCompleted
          ? Object.fromEntries(
              Array.from(
                getLessonAnswerFeedback(lessonState.questions, savedAnswers).entries(),
              ).map(([questionId, isCorrect]) => [questionId, isCorrect ? "Correct" : "Incorrect"]),
            )
          : {}
      }
      lessonName={lessonState.lesson.name}
      programId={lessonState.program.id}
      questions={lessonState.questions.map((question) => ({
        id: question.id,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
        })),
        rows: question.rows.map((row) => ({
          id: row.id,
          text: row.text,
        })),
        text: question.text,
        type: question.type,
      }))}
      savedAnswers={savedAnswers}
      status={lessonIsCompleted ? "completed" : listenedLesson ? "listened" : "not-listened"}
      videoUrl={lessonState.lesson.videoUrl}
    />,
  );
});

lessonEndpoints.post(lessonPath.$discussions, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id || currentUser.role !== "student") {
    return c.redirect(routes.auth.$login);
  }

  const access = await getStudentDiscussionLessonAccess({
    studentId: currentUser.id,
    programId: c.req.param("programId"),
    courseId: c.req.param("courseId"),
    lessonId: c.req.param("lessonId"),
  });
  if (!access.ok) {
    return c.text("Lesson not found", 404);
  }
  const { lessonState } = access.value;

  const body = trimText((await c.req.formData()).get("body"));
  if (!body) {
    return c.text("Discussion body is required", 400);
  }

  const discussion = await addLessonDiscussion({
    authorId: currentUser.id,
    body,
    lessonId: lessonState.lesson.id,
  });
  if (!discussion) {
    return c.text("Discussion not found", 404);
  }

  await notifyTeacherOfDiscussionQuestion({
    teacherId: lessonState.program.teacherId,
    lessonId: lessonState.lesson.id,
    questionBody: body,
  });

  return c.redirect(
    routes.programs
      .$(lessonState.program.id)
      .courses.$(lessonState.course.id)
      .lessons.$(lessonState.lesson.id)
      .toString(),
  );
});

lessonEndpoints.post(discussionPath.$reply, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const programId = c.req.param("programId");
  const courseId = c.req.param("courseId");
  const lessonId = c.req.param("lessonId");
  let replyStatus: "pending" | "approved";
  if (currentUser.role === "student") {
    const access = await getStudentDiscussionLessonAccess({
      studentId: currentUser.id,
      programId,
      courseId,
      lessonId,
    });
    if (!access.ok) {
      return c.text("Lesson not found", 404);
    }
    replyStatus = "pending";
  } else if (currentUser.role === "teacher") {
    const currentLesson = await getOwnedLesson(currentUser.id, programId, courseId, lessonId);
    if (!currentLesson) {
      return c.text("Lesson not found", 404);
    }
    replyStatus = "approved";
  } else {
    return c.text("Lesson not found", 404);
  }

  const body = trimText((await c.req.formData()).get("body"));
  if (!body) {
    return c.text("Discussion body is required", 400);
  }

  const discussion = await addLessonDiscussion({
    authorId: currentUser.id,
    body,
    lessonId,
    parentId: c.req.param("discussionId"),
    status: replyStatus,
  });
  if (!discussion) {
    return c.text("Discussion not found", 404);
  }

  return c.redirect(
    routes.programs.$(programId).courses.$(courseId).lessons.$(lessonId).toString(),
  );
});

lessonEndpoints.post(discussionPath.$approve, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  const currentLesson = await getOwnedLesson(
    currentUser.id,
    c.req.param("programId"),
    c.req.param("courseId"),
    c.req.param("lessonId"),
  );
  if (!currentLesson) {
    return c.text("Lesson not found", 404);
  }

  const approved = await approveLessonDiscussion({
    id: c.req.param("discussionId"),
    lessonId: currentLesson.id,
  });
  if (!approved) {
    return c.text("Discussion not found", 404);
  }

  return c.redirect(
    routes.programs
      .$(c.req.param("programId"))
      .courses.$(c.req.param("courseId"))
      .lessons.$(c.req.param("lessonId"))
      .toString(),
  );
});

lessonEndpoints.post(lessonPath.$complete, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  if (currentUser.role !== "student") {
    return c.text("Lesson not found", 404);
  }

  const result = await markLessonListened({
    studentId: currentUser.id,
    programId: c.req.param("programId"),
    courseId: c.req.param("courseId"),
    lessonId: c.req.param("lessonId"),
  });
  if (!result.ok) {
    return c.text("Lesson not found", 404);
  }

  return c.redirect(result.value.redirectTo);
});

lessonEndpoints.post(lessonPath.$answers, async (c) => {
  const currentUser = c.var.session?.user;
  if (!currentUser?.id) {
    return c.redirect(routes.auth.$login);
  }

  if (currentUser.role !== "student") {
    return c.text("Lesson not found", 404);
  }

  const result = await submitLessonAnswers({
    studentId: currentUser.id,
    programId: c.req.param("programId"),
    courseId: c.req.param("courseId"),
    lessonId: c.req.param("lessonId"),
    formData: await c.req.formData(),
  });
  if (!result.ok) {
    return c.text("Lesson not found", 404);
  }

  return c.redirect(result.value.redirectTo);
});
