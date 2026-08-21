import type { Specification } from "./types";

export const discussionSpecs: Specification = {
  "student sees their opened discussion as pending teacher approval": async (dsl) => {
    const args = await dsl.discussion.given["a student has listened to a lesson"]();
    await dsl.discussion.when["the student opens a discussion"](args);
    await dsl.discussion.then["the student can see their discussion pending teacher approval"](
      args,
    );
  },
  "teacher sees student-opened discussion pending approval": async (dsl) => {
    const args = await dsl.discussion.given["a student opened a discussion"]();
    await dsl.discussion.then["the teacher sees it as pending their approval"](args);
  },
  "student cannot submit a lesson question before listening to the lesson": async (dsl) => {
    const args = await dsl.discussion.given["a student who has not listened to a lesson"]();
    const result = await dsl.discussion.when["the student asks the lesson question"](args);
    await dsl.discussion.then["the lesson question is not accepted"](result);
  },
  "student cannot submit a lesson question outside their enrolled program": async (dsl) => {
    const args =
      await dsl.discussion.given["a student enrolled in a different program than the lesson"]();
    const result = await dsl.discussion.when["the student asks the lesson question"](args);
    await dsl.discussion.then["the lesson question is not accepted"](result);
  },
  "teacher sees student identity on a pending lesson question": async (dsl) => {
    const args = await dsl.discussion.given["a teacher with a pending lesson question"]();
    await dsl.discussion.then["the teacher can see the student's identity on that question"](args);
  },
  "student cannot see another student's pending discussion": async (dsl) => {
    const args =
      await dsl.discussion.given[
        "a student viewing a lesson with another student's pending discussion"
      ]();
    await dsl.discussion.then["they cannot see that discussion"](args);
  },
  "approved lesson question is visible to enrolled students anonymously": async (dsl) => {
    const args = await dsl.discussion.given["a teacher with a pending lesson question"]();
    await dsl.discussion.when["the teacher approves the question"](args);
    await dsl.discussion.then["enrolled students can see the approved question anonymously"](args);
  },
  "reply to an approved lesson question is pending teacher approval": async (dsl) => {
    const args = await dsl.discussion.given["a teacher with a pending lesson reply"]();
    await dsl.discussion.then["the reply is pending teacher approval"](args);
  },
  "teacher can reply to a student-opened lesson discussion": async (dsl) => {
    const args = await dsl.discussion.given["a student opened a discussion"]();
    await dsl.discussion.when["the teacher replies to that discussion after approving it"](args);
    await dsl.discussion.then["the student can see the teacher reply"](args);
  },
  "teacher reply to a pending lesson discussion is hidden from the student": async (dsl) => {
    const args = await dsl.discussion.given["a student opened a discussion"]();
    await dsl.discussion.when["the teacher replies to that discussion before approving it"](args);
    await dsl.discussion.then["the student cannot see the teacher reply"](args);
  },
  "approved lesson reply appears threaded under the question": async (dsl) => {
    const args = await dsl.discussion.given["a teacher with a pending lesson reply"]();
    await dsl.discussion.when["the teacher approves the reply"](args);
    await dsl.discussion.then["the reply appears threaded under the question"](args);
  },
  "student cannot reply to a discussion from another lesson": async (dsl) => {
    const args =
      await dsl.discussion.given[
        "a student with an approved discussion and another listened lesson"
      ]();
    const result =
      await dsl.discussion.when["the student replies to that discussion from the other lesson"](
        args,
      );
    await dsl.discussion.then["the reply is not accepted"](result);
  },
  "teacher cannot approve a discussion for another lesson": async (dsl) => {
    const args =
      await dsl.discussion.given["a teacher with a pending discussion and another owned lesson"]();
    const result =
      await dsl.discussion.when["the teacher approves that discussion from the other lesson"](args);
    await dsl.discussion.then["the original discussion remains pending"](result);
  },
};
