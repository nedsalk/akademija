import type { FC } from "hono/jsx";

export interface AnswerQuestionOption {
  id: string;
  text: string;
}

export interface AnswerQuestionRow {
  id: string;
  text: string;
}

export interface AnswerQuestion {
  id: string;
  options: AnswerQuestionOption[];
  rows: AnswerQuestionRow[];
  text: string;
  type: "radio" | "checkbox" | "radio-grid" | "checkbox-grid";
}

export interface SavedQuestionAnswer {
  questionId: string;
  questionOptionId: string;
  questionRowId: string | null;
}

export const QuestionAnswerGrid: FC<{
  disabled: boolean;
  inputType: "radio" | "checkbox";
  isChecked: (option: AnswerQuestionOption, row: AnswerQuestionRow) => boolean;
  name: (row: AnswerQuestionRow) => string;
  options: AnswerQuestionOption[];
  questionText?: string;
  rows: AnswerQuestionRow[];
}> = ({ disabled, inputType, isChecked, name, options, questionText, rows }) => {
  return (
    <table>
      <caption>{questionText}</caption>
      <thead>
        <tr>
          <th scope="col">Row</th>
          {options.map((option) => (
            <th scope="col">{option.text}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr>
            <th scope="row">{row.text}</th>
            {options.map((option) => (
              <td>
                <label>
                  <span class="visually-hidden">{option.text}</span>
                  <input
                    checked={isChecked(option, row)}
                    disabled={disabled}
                    name={name(row)}
                    type={inputType}
                    value={option.id}
                  />
                </label>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const QuestionAnswerFields: FC<{
  disabled: boolean;
  feedbackByQuestionId: Record<string, "Correct" | "Incorrect">;
  questions: AnswerQuestion[];
  savedAnswers: SavedQuestionAnswer[];
}> = ({ disabled, feedbackByQuestionId, questions, savedAnswers }) => {
  const savedAnswerKeys = new Set(
    savedAnswers.map(
      (answer) => `${answer.questionId}:${answer.questionRowId ?? ""}:${answer.questionOptionId}`,
    ),
  );

  const isChecked = (questionId: string, questionOptionId: string, questionRowId: string | null) =>
    savedAnswerKeys.has(`${questionId}:${questionRowId ?? ""}:${questionOptionId}`);

  return (
    <>
      {questions.map((question) => (
        <fieldset>
          <legend>{question.text}</legend>
          {question.type === "radio" || question.type === "checkbox" ? (
            <ul>
              {question.options.map((option) => (
                <li>
                  <label>
                    <input
                      checked={isChecked(question.id, option.id, null)}
                      disabled={disabled}
                      name={`question:${question.id}`}
                      type={question.type === "radio" ? "radio" : "checkbox"}
                      value={option.id}
                    />
                    {option.text}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <QuestionAnswerGrid
              disabled={disabled}
              inputType={question.type === "radio-grid" ? "radio" : "checkbox"}
              isChecked={(option, row) => isChecked(question.id, option.id, row.id)}
              name={(row) => `question:${question.id}:row:${row.id}`}
              options={question.options}
              questionText={question.text}
              rows={question.rows}
            />
          )}
          {feedbackByQuestionId[question.id] ? <p>{feedbackByQuestionId[question.id]}</p> : null}
        </fieldset>
      ))}
    </>
  );
};
