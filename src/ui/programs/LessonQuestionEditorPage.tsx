import type { FC } from "hono/jsx";
import { routes } from "../../routes";
import { TestMaker } from "../organisms/test-maker/test-maker";

interface SavedQuestion {
  options: { correctRows?: number[]; isCorrect: boolean; text: string }[];
  rows: string[];
  text: string;
  type: "radio" | "checkbox" | "radio-grid" | "checkbox-grid";
}

interface DiscussionItem {
  authorName: string;
  authorRole: string;
  body: string;
  id: string;
  replies: DiscussionItem[];
  status: "pending" | "approved" | "rejected";
}

interface LessonQuestionEditorPageProps {
  answerKeyQuestionIndex?: number;
  courseId: string;
  discussions: DiscussionItem[];
  focusTarget?: string;
  lessonId: string;
  lessonName: string;
  programId: string;
  questions: SavedQuestion[];
}

export const LessonQuestionEditorPage: FC<LessonQuestionEditorPageProps> = ({
  answerKeyQuestionIndex,
  courseId,
  discussions,
  focusTarget,
  lessonId,
  lessonName,
  programId,
  questions,
}) => {
  const courseRoute = routes.programs.$(programId).courses.$(courseId);
  const lessonRoute = courseRoute.lessons.$(lessonId);

  return (
    <>
      <a href={courseRoute.toString()}>&lt;- kurs</a>
      <h1>{lessonName}</h1>
      <div>
        <section>
          <h2>Pitanja</h2>
          <TestMaker
            action={lessonRoute.toString()}
            answerKeyQuestionIndex={answerKeyQuestionIndex}
            focusTarget={focusTarget}
            questions={questions}
          />
        </section>
        <section>
          <h2>Diskusije</h2>
          {discussions.length === 0 ? (
            <p>Trenutno nema diskusija.</p>
          ) : (
            <ul>
              {discussions.map((d) => (
                <li>
                  <p>
                    {d.authorName} - {d.status}
                  </p>
                  <p>{d.body}</p>
                  {d.status !== "approved" && (
                    <form method="post">
                      <button type="submit" formaction={lessonRoute.discussions.$(d.id).$approve}>
                        Approve
                      </button>
                    </form>
                  )}
                  <form method="post" action={lessonRoute.discussions.$(d.id).$reply}>
                    <textarea name="body" required></textarea>
                    <button type="submit">Submit Reply</button>
                  </form>

                  {d.replies.length > 0 ? (
                    <ul>
                      {d.replies.map((reply) => (
                        <li>
                          <p>
                            {reply.authorName} ({reply.authorRole}) - {reply.status}
                          </p>
                          <p>{reply.body}</p>
                          <form method="post" style="display:inline">
                            <button
                              type="submit"
                              formaction={lessonRoute.discussions.$(reply.id).$approve}
                            >
                              Approve
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
};
