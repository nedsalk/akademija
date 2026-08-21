import type { JSX, PropsWithChildren } from "hono/jsx";
import { questionEditorIntents } from "../../../features/question-editor-actions";
import { QuestionAnswerGrid } from "../../programs/QuestionAnswerFields";
import { FORM_ELEMENTS } from "./test-maker-form-elements";

export interface SavedQuestionOption {
  correctRows?: number[];
  text: string;
  isCorrect: boolean;
}

export interface SavedQuestion {
  text: string;
  type: "radio" | "checkbox" | "radio-grid" | "checkbox-grid";
  options: SavedQuestionOption[];
  rows?: string[];
}

interface TestMakerProps {
  action: string;
  answerKeyQuestionIndex?: number;
  focusTarget?: string;
  questions?: SavedQuestion[];
}

function intentButtonAttributes(
  intent: string,
  focusTarget: string | undefined,
  targetFocus?: string,
) {
  return {
    autofocus: targetFocus && focusTarget === targetFocus ? true : undefined,
    name: FORM_ELEMENTS.questionAction,
    value: intent,
  };
}

function IntentButton({
  children,
  focusTarget,
  intent,
  targetFocus,
  title,
}: PropsWithChildren<{
  focusTarget?: string;
  intent: string;
  targetFocus: string;
  title: string;
}>) {
  return (
    <button
      {...intentButtonAttributes(intent, focusTarget, targetFocus)}
      title={title}
      type="submit"
    >
      {children}
    </button>
  );
}

function RemoveBtn({ intent }: { intent: string }) {
  return (
    <button {...intentButtonAttributes(intent, undefined)} title="Izbriši" type="submit">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <title>Remove</title>
        <path
          fill="#5f6368"
          d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        ></path>
        <path d="M0 0h24v24H0z" fill="none"></path>
      </svg>
    </button>
  );
}

function ListItem({
  downFocusTarget,
  children,
  focusTarget,
  downIntent,
  removeIntent,
  upIntent,
  upFocusTarget,
}: PropsWithChildren<{
  downFocusTarget: string;
  focusTarget?: string;
  downIntent: string;
  removeIntent: string;
  upIntent: string;
  upFocusTarget: string;
}>) {
  return (
    <li>
      <div>
        <IntentButton
          focusTarget={focusTarget}
          intent={upIntent}
          targetFocus={upFocusTarget}
          title="Pomakni gore"
        >
          ▲
        </IntentButton>
        <IntentButton
          focusTarget={focusTarget}
          intent={downIntent}
          targetFocus={downFocusTarget}
          title="Pomakni dole"
        >
          ▼
        </IntentButton>
      </div>

      {children}
      <RemoveBtn intent={removeIntent} />
    </li>
  );
}

function Fieldset({
  addFocusTarget,
  addIntent,
  focusTarget,
  legend,
  ...props
}: JSX.IntrinsicElements["fieldset"] & {
  addFocusTarget: string;
  addIntent: string;
  focusTarget?: string;
  qIdx: number;
  legend: string;
}) {
  return (
    <fieldset {...props}>
      <legend>{legend}</legend>
      <ol>{props.children}</ol>
      <AddRowButton focusTarget={focusTarget} intent={addIntent} targetFocus={addFocusTarget} />
    </fieldset>
  );
}

interface SubQuestionProps {
  focusTarget?: string;
  qIdx: number;
  aIdx: number;
}

export function SubQuestion({ focusTarget, qIdx, aIdx }: SubQuestionProps) {
  return (
    <ListItem
      downFocusTarget={FORM_ELEMENTS.focus.subQuestionMove(qIdx, aIdx, "down")}
      downIntent={questionEditorIntents.moveRowDown(qIdx, aIdx)}
      focusTarget={focusTarget}
      removeIntent={questionEditorIntents.removeRow(qIdx, aIdx)}
      upIntent={questionEditorIntents.moveRowUp(qIdx, aIdx)}
      upFocusTarget={FORM_ELEMENTS.focus.subQuestionMove(qIdx, aIdx, "up")}
    >
      <input
        name={FORM_ELEMENTS.naming.qSubQuestionText(qIdx, aIdx)}
        type="text"
        placeholder="Red..."
      />
    </ListItem>
  );
}

function PersistedSubQuestion({
  focusTarget,
  qIdx,
  aIdx,
  value,
}: SubQuestionProps & { value: string }) {
  return (
    <ListItem
      downFocusTarget={FORM_ELEMENTS.focus.subQuestionMove(qIdx, aIdx, "down")}
      downIntent={questionEditorIntents.moveRowDown(qIdx, aIdx)}
      focusTarget={focusTarget}
      removeIntent={questionEditorIntents.removeRow(qIdx, aIdx)}
      upIntent={questionEditorIntents.moveRowUp(qIdx, aIdx)}
      upFocusTarget={FORM_ELEMENTS.focus.subQuestionMove(qIdx, aIdx, "up")}
    >
      <input
        name={FORM_ELEMENTS.naming.qSubQuestionText(qIdx, aIdx)}
        type="text"
        placeholder="Red..."
        value={value}
      />
    </ListItem>
  );
}

function SubQuestions({
  focusTarget,
  qIdx,
  subQuestions,
}: {
  focusTarget?: string;
  qIdx: number;
  subQuestions: string[];
}) {
  return (
    <Fieldset
      addFocusTarget={FORM_ELEMENTS.focus.addSubQuestion(qIdx)}
      addIntent={questionEditorIntents.addRow(qIdx)}
      focusTarget={focusTarget}
      name={FORM_ELEMENTS.subQuestions}
      qIdx={qIdx}
      legend="Redovi"
    >
      {subQuestions.map((subQuestion, aIdx) => (
        <PersistedSubQuestion
          focusTarget={focusTarget}
          qIdx={qIdx}
          aIdx={aIdx}
          value={subQuestion}
        />
      ))}
    </Fieldset>
  );
}

function AnswerTypeField({
  answerKeyIsOpen,
  focusTarget,
  qIdx,
  selectedType,
}: {
  answerKeyIsOpen: boolean;
  focusTarget?: string;
  qIdx: number;
  selectedType?: string;
}) {
  // Default to radio if not specified
  const formType = selectedType || FORM_ELEMENTS.answerType.radio;
  const isGrid =
    formType === FORM_ELEMENTS.answerType.radioGrid ||
    formType === FORM_ELEMENTS.answerType.checkboxGrid;
  const answerKeyButtonText = answerKeyIsOpen ? "Redovi/Odgovori" : "Ključ odgovora";
  const typeOptions = [
    {
      label: "Jedan odgovor",
      value: FORM_ELEMENTS.answerType.radio,
    },
    {
      label: "Više odgovora",
      value: FORM_ELEMENTS.answerType.checkbox,
    },
    {
      label: "(mreža) Jedan odgovor",
      value: FORM_ELEMENTS.answerType.radioGrid,
    },
    {
      label: "(mreža) Više odgovora",
      value: FORM_ELEMENTS.answerType.checkboxGrid,
    },
  ];
  return (
    <div class="answer-type-actions">
      <input type="hidden" name={FORM_ELEMENTS.naming.qType(qIdx)} value={formType} />
      {typeOptions.map((option, idx) => {
        const focusKey = FORM_ELEMENTS.focus.questionType(qIdx, option.value);
        return (
          <button
            {...intentButtonAttributes(
              questionEditorIntents.applyQuestion(qIdx, option.value),
              focusTarget,
              focusKey,
            )}
            aria-pressed={formType === option.value}
            title={option.label}
            type="submit"
          >
            {idx === 0 && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <title>{option.label}</title>
                <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z" />
              </svg>
            )}

            {idx === 1 && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <title>{option.label}</title>
                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" />
              </svg>
            )}

            {idx === 2 &&
              [0, 0, 0, 0].map(() => (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="12px"
                  viewBox="0 -960 960 960"
                  width="12px"
                  fill="currentColor"
                >
                  <title>{option.label}</title>
                  <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z" />
                </svg>
              ))}

            {idx === 3 &&
              [0, 0, 0, 0].map(() => (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="12px"
                  viewBox="0 -960 960 960"
                  width="12px"
                  fill="currentColor"
                >
                  <title>{option.label}</title>
                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" />
                </svg>
              ))}
          </button>
        );
      })}
      {isGrid && (
        <button
          {...intentButtonAttributes(
            answerKeyIsOpen
              ? questionEditorIntents.closeAnswerKey(qIdx)
              : questionEditorIntents.openAnswerKey(qIdx),
            focusTarget,
            FORM_ELEMENTS.focus.answerKey(qIdx),
          )}
          class="answer-key-button"
          title={answerKeyButtonText}
          type="submit"
        >
          {answerKeyButtonText}
        </button>
      )}
    </div>
  );
}

function GridAnswerKeyPanel({
  answerOptions,
  inputType,
  qIdx,
  rows,
}: {
  answerOptions: SavedQuestionOption[];
  inputType: "radio" | "checkbox";
  qIdx: number;
  rows: string[];
}) {
  return (
    <fieldset class="answer-key-panel">
      <legend>Ključ odgovora</legend>
      {answerOptions.map((option, aIdx) => (
        <input
          type="hidden"
          name={FORM_ELEMENTS.naming.qAnswerText(qIdx, aIdx)}
          value={option.text}
        />
      ))}
      {rows.map((row, rIdx) => (
        <input type="hidden" name={FORM_ELEMENTS.naming.qSubQuestionText(qIdx, rIdx)} value={row} />
      ))}
      <QuestionAnswerGrid
        disabled={false}
        inputType={inputType}
        isChecked={(option, row) => {
          const answerOption = answerOptions[Number(option.id)];
          const rowIndex = Number(row.id);
          return answerOption?.correctRows
            ? answerOption.correctRows.includes(rowIndex)
            : answerOption?.isCorrect === true;
        }}
        name={(row) => FORM_ELEMENTS.naming.qGridAnswer(qIdx, Number(row.id))}
        options={answerOptions.map((option, aIdx) => ({
          id: String(aIdx),
          text: option.text || `Odgovor ${aIdx + 1}`,
        }))}
        rows={rows.map((row, rIdx) => ({
          id: String(rIdx),
          text: row || `Red ${rIdx + 1}`,
        }))}
        questionText="Ključ odgovora"
      />
    </fieldset>
  );
}

function HiddenGridAnswerKeyInputs({
  answerOptions,
  qIdx,
  rows,
}: {
  answerOptions: SavedQuestionOption[];
  qIdx: number;
  rows: string[];
}) {
  return (
    <>
      {answerOptions.map((option, aIdx) => {
        const correctRows =
          option.correctRows ?? (option.isCorrect ? rows.map((_, rIdx) => rIdx) : []);
        return correctRows.map((rIdx) => (
          <input type="hidden" name={FORM_ELEMENTS.naming.qGridAnswer(qIdx, rIdx)} value={aIdx} />
        ));
      })}
    </>
  );
}

function AddRowButton(props: { focusTarget?: string; intent: string; targetFocus: string }) {
  return (
    <button
      {...intentButtonAttributes(props.intent, props.focusTarget, props.targetFocus)}
      type="submit"
    >
      Dodaj
    </button>
  );
}

interface AnswerSetProps {
  focusTarget?: string;
  qIdx: number;
  aIdx: number;
  val: string;
  type: "radio" | "checkbox" | null;
  checked?: boolean;
}

export const Answer = ({
  focusTarget,
  type,
  qIdx,
  aIdx,
  val = "",
  checked = false,
}: AnswerSetProps) => {
  return (
    <ListItem
      downFocusTarget={FORM_ELEMENTS.focus.answerMove(qIdx, aIdx, "down")}
      downIntent={questionEditorIntents.moveAnswerDown(qIdx, aIdx)}
      focusTarget={focusTarget}
      removeIntent={questionEditorIntents.removeAnswer(qIdx, aIdx)}
      upIntent={questionEditorIntents.moveAnswerUp(qIdx, aIdx)}
      upFocusTarget={FORM_ELEMENTS.focus.answerMove(qIdx, aIdx, "up")}
    >
      {type ? (
        <input
          type={type}
          tabindex={0}
          name={FORM_ELEMENTS.naming.qAnswer(qIdx)}
          value={aIdx}
          checked={checked}
        />
      ) : null}
      <input
        type="text"
        placeholder="Answer"
        name={FORM_ELEMENTS.naming.qAnswerText(qIdx, aIdx)}
        value={val}
      />
    </ListItem>
  );
};

function Answers({
  focusTarget,
  qIdx,
  answerOptions,
  questionType,
}: {
  focusTarget?: string;
  qIdx: number;
  answerOptions: SavedQuestionOption[];
  questionType?: string;
}) {
  const isGrid = questionType === "radio-grid" || questionType === "checkbox-grid";
  const inputType = isGrid ? null : questionType === "checkbox" ? "checkbox" : "radio";

  return (
    <Fieldset
      addFocusTarget={FORM_ELEMENTS.focus.addAnswer(qIdx)}
      addIntent={questionEditorIntents.addAnswer(qIdx)}
      focusTarget={focusTarget}
      name={FORM_ELEMENTS.answers}
      qIdx={qIdx}
      legend="Odgovori"
    >
      {answerOptions.map((opt, aIdx) => (
        <Answer
          focusTarget={focusTarget}
          type={inputType}
          qIdx={qIdx}
          aIdx={aIdx}
          val={opt.text}
          checked={opt.isCorrect}
        />
      ))}
    </Fieldset>
  );
}

function Question({
  answerKeyQuestionIndex,
  focusTarget,
  qIdx,
  savedData,
}: {
  answerKeyQuestionIndex?: number;
  focusTarget?: string;
  qIdx: number;
  savedData?: SavedQuestion;
}) {
  const showSubQuestions = savedData?.type === "radio-grid" || savedData?.type === "checkbox-grid";

  // Default to 2 empty answers if no saved data
  const answerOptions = savedData?.options?.length
    ? savedData.options
    : [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ];
  const rows = savedData?.rows?.length ? savedData.rows : ["", ""];
  const answerKeyIsOpen = answerKeyQuestionIndex === qIdx && showSubQuestions;
  const answerKeyInputType =
    savedData?.type === FORM_ELEMENTS.answerType.checkboxGrid ? "checkbox" : "radio";

  return (
    <fieldset name="question">
      {answerKeyIsOpen ? (
        <input type="hidden" name={FORM_ELEMENTS.answerKeyQuestionIndex} value={qIdx} />
      ) : null}
      <legend>{FORM_ELEMENTS.naming.question(qIdx)}</legend>
      <div>
        <button
          {...intentButtonAttributes(questionEditorIntents.moveQuestionDown(qIdx), undefined)}
          title="Pomakni pitanje dole"
          type="submit"
        >
          ▼
        </button>
        <button
          {...intentButtonAttributes(questionEditorIntents.moveQuestionUp(qIdx), undefined)}
          title="Pomakni pitanje gore"
          type="submit"
        >
          ▲
        </button>

        <button
          {...intentButtonAttributes(questionEditorIntents.removeQuestion(qIdx), undefined)}
          title="Izbriši pitanje"
          type="submit"
        >
          Izbriši
        </button>
      </div>

      <fieldset name={FORM_ELEMENTS.textAndType}>
        <label>
          Tekst pitanja
          <input
            type="text"
            name={FORM_ELEMENTS.naming.qText(qIdx)}
            placeholder="Tekst pitanja..."
            value={savedData?.text || ""}
          ></input>
        </label>
        <AnswerTypeField
          answerKeyIsOpen={answerKeyIsOpen}
          focusTarget={focusTarget}
          qIdx={qIdx}
          selectedType={savedData?.type}
        />
      </fieldset>

      <div>
        {answerKeyIsOpen ? (
          <GridAnswerKeyPanel
            answerOptions={answerOptions}
            inputType={answerKeyInputType}
            qIdx={qIdx}
            rows={rows}
          />
        ) : (
          <>
            {showSubQuestions && (
              <SubQuestions focusTarget={focusTarget} qIdx={qIdx} subQuestions={rows} />
            )}
            <Answers
              focusTarget={focusTarget}
              qIdx={qIdx}
              answerOptions={answerOptions}
              questionType={savedData?.type}
            />
            {showSubQuestions ? (
              <HiddenGridAnswerKeyInputs answerOptions={answerOptions} qIdx={qIdx} rows={rows} />
            ) : null}
          </>
        )}
      </div>
    </fieldset>
  );
}

export function TestMaker({
  action,
  answerKeyQuestionIndex,
  focusTarget,
  questions,
}: TestMakerProps) {
  return (
    <form method="post" action={action}>
      {questions?.map((q, idx) => (
        <>
          <Question
            answerKeyQuestionIndex={answerKeyQuestionIndex}
            focusTarget={focusTarget}
            qIdx={idx}
            savedData={q}
          />
        </>
      ))}
      <section>
        <IntentButton
          focusTarget={focusTarget}
          intent={questionEditorIntents.addQuestion}
          targetFocus={FORM_ELEMENTS.focus.addQuestion}
          title="Dodaj pitanje"
        >
          Dodaj pitanje
        </IntentButton>

        <button type="submit">Sačuvaj</button>
      </section>
    </form>
  );
}
