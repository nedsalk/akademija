import type { Specification } from "./types";

let attendanceSpecs: Specification = {
  "teacher can save an attendance rule for a course": async (dsl) => {
    const args = await dsl.attendance.given["a teacher configuring attendance for a course"]();
    await dsl.attendance.when["they set the maximum consecutive missed lessons"](args);
    await dsl.attendance.then["the new rule is saved"](args);
  },
  "teacher cannot save a negative attendance rule": async (dsl) => {
    const args = await dsl.attendance.given["a teacher configuring attendance for a course"]();
    const result = await dsl.attendance.when["they save an invalid attendance rule"](args);
    await dsl.attendance.then["the invalid attendance rule is refused"](result);
  },
  "student below the missed-lesson threshold does not create a violation": async (dsl) => {
    const args = await dsl.attendance.given["a student below the missed-lesson threshold"]();
    await dsl.attendance.then["no attendance violation exists"](args);
  },
  "completing the current lesson after prior misses resets the violation state": async (dsl) => {
    const args =
      await dsl.attendance.given["a student who completed the current lesson after prior misses"]();
    await dsl.attendance.then["no attendance violation exists"](args);
  },
  "exceeding the missed-lesson threshold creates an attendance violation": async (dsl) => {
    const args = await dsl.attendance.given["a student who exceeded the missed-lesson threshold"]();
    await dsl.attendance.then["an attendance violation exists"](args);
  },
  "opening a course page does not create attendance violations": async (dsl) => {
    const args =
      await dsl.attendance.given[
        "a student who exceeded the missed-lesson threshold before evaluation"
      ]();
    await dsl.attendance.then["no attendance violation exists"](args);
  },
  "running attendance evaluation creates attendance violations": async (dsl) => {
    const args =
      await dsl.attendance.given[
        "a student who exceeded the missed-lesson threshold before evaluation"
      ]();
    await dsl.attendance.when["they evaluate attendance"](args);
    await dsl.attendance.then["an attendance violation exists"](args);
  },
  "teacher can acknowledge an attendance violation": async (dsl) => {
    const args =
      await dsl.attendance.given["a teacher with an unacknowledged attendance violation"]();
    await dsl.attendance.when["they acknowledge the violation"](args);
    await dsl.attendance.then["the violation is marked acknowledged"](args);
  },
  "teacher cannot acknowledge a violation from another course": async (dsl) => {
    const args =
      await dsl.attendance.given["a teacher with another course's attendance violation id"]();
    const result = await dsl.attendance.when["they acknowledge the other course's violation"](args);
    await dsl.attendance.then["the other course violation remains open"](result);
  },
};

attendanceSpecs = {};

export { attendanceSpecs };
