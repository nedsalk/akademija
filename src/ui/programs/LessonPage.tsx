import type { FC } from "hono/jsx";
import { routes } from "../../routes";
import {
  type AnswerQuestion,
  QuestionAnswerFields,
  type SavedQuestionAnswer,
} from "./QuestionAnswerFields";

interface LessonDiscussion {
  authorLabel: string;
  body: string;
  id: string;
  replies: LessonDiscussion[];
  status: "pending" | "approved" | "rejected";
}

interface LessonPageProps {
  answerAction: string;
  completeAction: string;
  courseId: string;
  discussionAction: string;
  feedbackByQuestionId: Record<string, "Correct" | "Incorrect">;
  discussions: LessonDiscussion[];
  lessonName: string;
  programId: string;
  questions: AnswerQuestion[];
  savedAnswers: SavedQuestionAnswer[];
  status: "not-listened" | "listened" | "completed";
  videoUrl: string;
}

export const LessonPage: FC<LessonPageProps> = ({
  answerAction,
  completeAction,
  courseId,
  discussionAction,
  feedbackByQuestionId,
  discussions,
  lessonName,
  programId,
  questions,
  savedAnswers,
  status,
  videoUrl,
}) => {
  const questionsAreVisible = status !== "not-listened";
  const answersAreLocked = status === "completed";

  return (
    <div>
      <h1>{lessonName}</h1>
      <a href={routes.programs.$(programId).courses.$(courseId).toString()}>Nazad na kurs</a>
      {videoUrl ? (
        <section>
          <h2>Lesson Video</h2>
          <iframe src={videoUrl} title={lessonName} allowFullScreen />
        </section>
      ) : null}
      {status === "not-listened" ? (
        <form method="post" action={completeAction}>
          <button type="submit">I have listened to this lesson</button>
        </form>
      ) : (
        <p>Lesson status: {status === "completed" ? "Completed" : "Listened"}</p>
      )}
      {questionsAreVisible ? (
        <section>
          <h2>Questions</h2>
          <form method="post" action={answerAction}>
            <QuestionAnswerFields
              disabled={answersAreLocked}
              feedbackByQuestionId={feedbackByQuestionId}
              questions={questions}
              savedAnswers={savedAnswers}
            />
            {answersAreLocked ? null : <button type="submit">Submit Answers</button>}
          </form>
        </section>
      ) : null}
      {questionsAreVisible ? (
        <section>
          <h2>Lesson Discussion</h2>
          <form method="post" action={discussionAction}>
            <label>
              Ask a question
              <textarea name="body" required></textarea>
            </label>
            <button type="submit">Submit Question</button>
          </form>
          {discussions.length === 0 ? (
            <p>No approved discussion yet.</p>
          ) : (
            <ul>
              {discussions.map((discussion) => (
                <li>
                  <p>{discussion.authorLabel}</p>
                  {discussion.status === "pending" ? <p>pending</p> : null}
                  <p>{discussion.body}</p>
                  <form method="post" action={`${discussionAction}/${discussion.id}/reply`}>
                    <label>
                      Reply
                      <textarea name="body" required></textarea>
                    </label>
                    <button type="submit">Submit Reply</button>
                  </form>
                  {discussion.replies.length > 0 ? (
                    <ul>
                      {discussion.replies.map((reply) => (
                        <li>
                          <p>{reply.authorLabel}</p>
                          {reply.status === "pending" ? <p>pending</p> : null}
                          <p>{reply.body}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
};
