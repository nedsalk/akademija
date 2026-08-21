import type { Specification } from "./types";

let assessmentSpecs: Specification = {
  "student sees a weekly test after seven released lessons in a course": async (dsl) => {
    const args =
      await dsl.assessment.given[
        "an enrolled student with seven released lessons and a published weekly test"
      ]();
    await dsl.assessment.then["the weekly test is available"](args);
  },
  "student cannot open the weekly test before its window opens": async (dsl) => {
    const args = await dsl.assessment.given["an enrolled student before the weekly test window"]();
    await dsl.assessment.then["the weekly test is unavailable"](args);
  },
  "student cannot open the weekly test after its window closes": async (dsl) => {
    const args = await dsl.assessment.given["an enrolled student after the weekly test window"]();
    await dsl.assessment.then["the weekly test is unavailable"](args);
  },
  "teacher can replace auto-selected weekly questions before publishing the weekly test": async (
    dsl,
  ) => {
    const args =
      await dsl.assessment.given[
        "a student viewing a weekly test published with chosen questions"
      ]();
    await dsl.assessment.then["the weekly test uses chosen questions"](args);
  },
  "student cannot open an assessment from a course outside their enrolled program": async (dsl) => {
    const args =
      await dsl.assessment.given[
        "a student enrolled in another program than the assessment course"
      ]();
    const result =
      await dsl.assessment.when["the student opens that assessment from their enrolled program"](
        args,
      );
    await dsl.assessment.then["the assessment is unavailable"](result);
  },
  "teacher cannot publish an assessment with questions from another course": async (dsl) => {
    const args = await dsl.assessment.given["a teacher with a question from another course"]();
    const result =
      await dsl.assessment.when[
        "the teacher publishes an assessment with another course's question"
      ](args);
    await dsl.assessment.then["the assessment is not published"](result);
  },
  "student submits a weekly test and sees a saved score": async (dsl) => {
    const args = await dsl.assessment.given["a student taking an available weekly test"]();
    await dsl.assessment.when["the student submits correct weekly test answers"](args);
    await dsl.assessment.then["their weekly test score is saved"](args);
  },
  "student cannot submit the same weekly test twice": async (dsl) => {
    const args =
      await dsl.assessment.given["a student who already submitted an available weekly test"]();
    const result = await dsl.assessment.when["the student submits the same assessment again"](args);
    await dsl.assessment.then["the assessment submission is refused"](result);
  },
  "student sees a final test when the course book is complete": async (dsl) => {
    const args =
      await dsl.assessment.given[
        "a student who completed a course book with a published final test"
      ]();
    await dsl.assessment.then["the final test is available"](args);
  },
  "student who fails the final test less than seven days ago cannot retry it": async (dsl) => {
    const args =
      await dsl.assessment.given["a student who failed the final test less than seven days ago"]();
    await dsl.assessment.then["the final test retry is unavailable"](args);
  },
  "student who failed a final test cannot post a retry before seven days": async (dsl) => {
    const args =
      await dsl.assessment.given[
        "a student on a failed final test result less than seven days ago"
      ]();
    const result = await dsl.assessment.when["the student submits the same assessment again"](args);
    await dsl.assessment.then["the assessment submission is refused"](result);
  },
  "student who fails the final test can retry it after seven days": async (dsl) => {
    const args = await dsl.assessment.given["a student who failed the final test seven days ago"]();
    await dsl.assessment.then["the final test retry is available"](args);
  },
  "student who submits final-test answers below the passing threshold fails": async (dsl) => {
    const args = await dsl.assessment.given["a student taking an available final test"]();
    await dsl.assessment.when["the student submits answers below the passing threshold"](args);
    await dsl.assessment.then["the final test is marked failed"](args);
  },
  "student who submits final-test answers at or above the passing threshold passes": async (
    dsl,
  ) => {
    const args = await dsl.assessment.given["a student taking an available final test"]();
    await dsl.assessment.when["the student submits answers at or above the passing threshold"](
      args,
    );
    await dsl.assessment.then["the final test is marked passed"](args);
  },
  "student who passed a final test cannot submit it again": async (dsl) => {
    const args = await dsl.assessment.given["a student who passed an available final test"]();
    const result = await dsl.assessment.when["the student submits the same assessment again"](args);
    await dsl.assessment.then["the assessment submission is refused"](result);
  },
  "student can still access the next course after failing the final test": async (dsl) => {
    const args =
      await dsl.assessment.given[
        "a student who failed the final test in the current course while the next course exists"
      ]();
    await dsl.assessment.then["the next course can still be opened"](args);
  },
};

assessmentSpecs = {};

export { assessmentSpecs };
