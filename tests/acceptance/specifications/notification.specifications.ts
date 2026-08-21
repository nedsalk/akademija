import type { Specification } from "./types";

let notificationSpecs: Specification = {
  "student can save a notification subscription": async (dsl) => {
    const args = await dsl.notification.given["a student enabling notifications"]();
    await dsl.notification.when["they subscribe to notifications"](args);
    await dsl.notification.then["their notification subscription is saved"](args);
  },
  "subscribed student receives a new-lesson notification record": async (dsl) => {
    const args =
      await dsl.notification.given["a subscribed student with a newly released lesson"]();
    await dsl.notification.then["a new-lesson notification record exists"](args);
  },
  "subscribed student receives a missed-lesson reminder notification record": async (dsl) => {
    const args =
      await dsl.notification.given[
        "a subscribed student with a released lesson still incomplete for twenty-four hours"
      ]();
    await dsl.notification.then["a missed-lesson reminder notification record exists"](args);
  },
  "teacher receives a question notification record": async (dsl) => {
    const args = await dsl.notification.given["a teacher with a newly submitted lesson question"]();
    await dsl.notification.then["a question notification record exists"](args);
  },
  "teacher receives an attendance notification record": async (dsl) => {
    const args = await dsl.notification.given["a teacher with a new attendance violation"]();
    await dsl.notification.then["an attendance notification record exists"](args);
  },
};

notificationSpecs = {};

export { notificationSpecs };
