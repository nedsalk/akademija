import type { FC } from "hono/jsx";
import {
  type AnswerQuestion,
  QuestionAnswerFields,
  type SavedQuestionAnswer,
} from "./QuestionAnswerFields";

interface AssessmentPageProps {
  assessmentName: string;
  attemptStatus?: "passed" | "failed";
  backHref: string;
  canSubmit: boolean;
  feedbackByQuestionId: Record<string, "Correct" | "Incorrect">;
  questions: AnswerQuestion[];
  savedAnswers: SavedQuestionAnswer[];
  scorePercent?: number;
  submitAction: string;
}

export const AssessmentPage: FC<AssessmentPageProps> = ({
  assessmentName,
  attemptStatus,
  backHref,
  canSubmit,
  feedbackByQuestionId,
  questions,
  savedAnswers,
  scorePercent,
  submitAction,
}) => {
  return (
    <div>
      <h1>{assessmentName}</h1>
      <a href={backHref}>Nazad na kurs</a>
      {typeof scorePercent === "number" ? (
        <p>
          Score: <output name="assessment-score">{scorePercent}%</output>
        </p>
      ) : null}
      {attemptStatus ? (
        <p>
          Result: <output name="assessment-status">{attemptStatus}</output>
        </p>
      ) : null}

      <form method="post" action={submitAction}>
        <QuestionAnswerFields
          disabled={!canSubmit}
          feedbackByQuestionId={feedbackByQuestionId}
          questions={questions}
          savedAnswers={savedAnswers}
        />
        {canSubmit ? <button type="submit">Submit Test</button> : null}
      </form>
    </div>
  );
};
