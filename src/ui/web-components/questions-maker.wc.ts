import { FORM_ELEMENTS } from "../organisms/test-maker/test-maker-form-elements";
import { getFragmentOf } from "./import-template-fragment";
import { ParsedHTMLElement } from "./parsed-html-element.wc";

function reindexAll(container: Element) {
  const questions = Array.from(
    container.querySelectorAll<HTMLFieldSetElement>(":scope > fieldset[name='question']"),
  );
  const answerInputsByQuestion = questions.map((question) =>
    Array.from(
      question.querySelectorAll<HTMLInputElement>(
        `fieldset[name='${FORM_ELEMENTS.answers}'] :is(input[type='radio'], input[type='checkbox'])`,
      ),
    ).map((input) => ({
      checked: input.checked,
      input,
    })),
  );

  questions.forEach((question, qIdx) => {
    const legend = question.querySelector("legend") as HTMLLegendElement;
    if (legend.textContent !== FORM_ELEMENTS.naming.question(qIdx)) {
      legend.textContent = FORM_ELEMENTS.naming.question(qIdx);
    }

    (
      question.querySelector<HTMLInputElement>(
        `fieldset[name='${FORM_ELEMENTS.textAndType}'] input[type='text']`,
      ) as HTMLInputElement
    ).name = FORM_ELEMENTS.naming.qText(qIdx);

    (
      question.querySelector<HTMLInputElement>(
        `fieldset[name='${FORM_ELEMENTS.textAndType}'] input[type='hidden'][name^='q-'][name$='-type']`,
      ) as HTMLInputElement
    ).name = FORM_ELEMENTS.naming.qType(qIdx);

    answerInputsByQuestion[qIdx]?.forEach(({ input }, aIdx) => {
      input.name = `__reindex-${qIdx}-${aIdx}`;
      input.value = aIdx.toString();
    });

    question
      .querySelectorAll<HTMLInputElement>(
        `fieldset[name='${FORM_ELEMENTS.answers}'] input[type='text']`,
      )
      .forEach((input, aIdx) => {
        input.name = FORM_ELEMENTS.naming.qAnswerText(qIdx, aIdx);
      });

    question
      .querySelectorAll<HTMLInputElement>(
        `fieldset[name='${FORM_ELEMENTS.subQuestions}'] input[type='text']`,
      )
      .forEach((input, aIdx) => {
        input.name = FORM_ELEMENTS.naming.qSubQuestionText(qIdx, aIdx);
      });
  });

  answerInputsByQuestion.forEach((answerInputs, qIdx) => {
    answerInputs.forEach(({ checked, input }, aIdx) => {
      input.name = FORM_ELEMENTS.naming.qAnswer(qIdx);
      input.value = aIdx.toString();
      input.checked = checked;
    });
  });
}

function changeAnswerType(input: HTMLInputElement) {
  const question = input.closest("[name='question']") as HTMLFieldSetElement;
  const type = input.value.split("-")[0] as "radio" | "checkbox";

  const elements = Array.from(question.elements) as HTMLInputElement[];

  elements.forEach((e) => {
    const isAnswer = e.type === "radio" || e.type === "checkbox";
    if (!isAnswer) return;

    e.type = type;
  });

  const addAnswerButton = question.querySelector<HTMLButtonElement>(
    "button[data-template-id*=answer-template]",
  ) as HTMLButtonElement;

  addAnswerButton.dataset.templateId = FORM_ELEMENTS.actions.addAnswer.templateIds[type];

  const isGrid =
    input.value === FORM_ELEMENTS.answerType.checkboxGrid ||
    input.value === FORM_ELEMENTS.answerType.radioGrid;

  const subQuestions = question.elements.namedItem(FORM_ELEMENTS.subQuestions);

  if (isGrid) {
    if (subQuestions) return;

    const subQuestionsFragment = getFragmentOf(FORM_ELEMENTS.templateIds.subQuestions);
    const answers = question.elements.namedItem(FORM_ELEMENTS.answers);
    answers?.insertAdjacentElement("beforebegin", subQuestionsFragment);
  } else {
    subQuestions?.remove();
  }
}

function removeAnswer(el: Element) {
  const isOnlyAnswer =
    el.previousElementSibling?.nodeName !== el.nodeName &&
    el.nextElementSibling?.nodeName !== el.nodeName;

  if (isOnlyAnswer) {
    return;
  }

  el.remove();
}

class QuestionsMaker extends ParsedHTMLElement {
  parsingFinishedCallback() {
    new MutationObserver(() => reindexAll(this)).observe(this, {
      childList: true,
      subtree: true,
    });

    this.addEventListener("change", (e) => {
      if (
        !(e.target instanceof HTMLInputElement) ||
        e.target.type !== "hidden" ||
        !/^q-\d+-type$/.test(e.target.name)
      ) {
        return;
      }

      changeAnswerType(e.target);
    });

    this.addEventListener("click", (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>("button[data-action]");

      switch (btn?.dataset.action) {
        case FORM_ELEMENTS.actions.addQuestion.name: {
          const fragment = getFragmentOf(FORM_ELEMENTS.actions.addQuestion.templateId);
          this.appendChild(fragment);
          break;
        }
        case FORM_ELEMENTS.actions.addAnswer.name: {
          if (!btn.dataset.templateId) {
            return;
          }
          const fragment = getFragmentOf(btn.dataset.templateId);

          const target = btn.previousElementSibling;
          target?.appendChild(fragment);
          break;
        }
        case FORM_ELEMENTS.actions.removeAnswer:
          removeAnswer(btn.parentElement as Element);
          break;
        case FORM_ELEMENTS.actions.removeQuestion: {
          const question = btn.closest("fieldset[name='question']");
          question?.remove();
          break;
        }
      }
    });

    this.addEventListener("keydown", (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>("button[data-action]");

      if (btn?.dataset.action !== FORM_ELEMENTS.actions.reorder) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

      e.preventDefault();

      const reorderable = btn.closest("[data-reorderable]") as HTMLElement;

      if (!reorderable) return;

      switch (e.key) {
        case "ArrowUp":
          reorderable.previousElementSibling?.insertAdjacentElement("beforebegin", reorderable);
          break;
        case "ArrowDown":
          reorderable.nextElementSibling?.insertAdjacentElement("afterend", reorderable);
          break;
        default:
      }

      reorderable.classList.remove("is-reordering");
      // 2. Force a "reflow" (optional, ensures the animation restarts)
      void reorderable.offsetWidth;
      reorderable.classList.add("is-reordering");
      reorderable.addEventListener(
        "animationend",
        () => {
          reorderable.classList.remove("is-reordering");
        },
        { once: true },
      );

      btn.focus();
    });
  }
}

const componentName = "questions-maker";

customElements.define(componentName, QuestionsMaker);
