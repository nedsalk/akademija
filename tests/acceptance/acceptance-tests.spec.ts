import { createPlaywrightDrivers } from "./drivers/playwright/create-drivers";
import { createDSL } from "./dsl";
import { expect, test } from "./fixtures";
import { maybeHandoffToMcp } from "./mcp-handoff";
import { adminSpecs } from "./specifications/admin.specifications";
import { assessmentSpecs } from "./specifications/assessment.specifications";
import { attendanceSpecs } from "./specifications/attendance.specifications";
import { authSpecs } from "./specifications/auth.specifications";
import { certificateSpecs } from "./specifications/certificate.specifications";
import { discussionSpecs } from "./specifications/discussion.specifications";
import { enrollmentSpecs } from "./specifications/enrollment.specifications";
import { lessonFlowSpecs } from "./specifications/lesson-flow.specifications";
import { notificationSpecs } from "./specifications/notification.specifications";
import { programSpecs } from "./specifications/program.specifications";
import { pwaSpecs } from "./specifications/pwa.specifications";
import { questionSpecs } from "./specifications/question.specifications";
import { registrationSpecs } from "./specifications/registration.specifications";
import { teacherSpecs } from "./specifications/teacher.specifications";
import type { Specification } from "./specifications/types";

const tests: Record<string, Specification> = {
  Registration: registrationSpecs,
  Auth: authSpecs,
  Admin: adminSpecs,
  Teacher: teacherSpecs,
  Program: programSpecs,
  Question: questionSpecs,
  Enrollment: enrollmentSpecs,
  LessonFlow: lessonFlowSpecs,
  Assessment: assessmentSpecs,
  Certificate: certificateSpecs,
  Discussion: discussionSpecs,
  Attendance: attendanceSpecs,
  PWA: pwaSpecs,
  Notification: notificationSpecs,
};

Object.entries(tests).forEach(([groupName, specs]) => {
  test.describe(groupName, () => {
    for (const [name, spec] of Object.entries(specs)) {
      test(name, async ({ baseURL, page, seededUsers }, testInfo) => {
        if (process.env.MCP_HANDOFF === "1") {
          testInfo.setTimeout(60 * 60 * 1000);
        }

        if (!baseURL) {
          throw new Error("baseURL is required for acceptance tests");
        }

        const drivers = createPlaywrightDrivers(page, baseURL, seededUsers);
        const dsl = createDSL(drivers, expect);

        testInfo.setTimeout(60 * 1000);

        try {
          try {
            await spec(dsl);
          } catch (error) {
            await maybeHandoffToMcp({
              baseURL,
              drivers,
              error,
              groupName,
              specName: name,
            });
            throw error;
          }

          await maybeHandoffToMcp({
            baseURL,
            drivers,
            groupName,
            specName: name,
          });
        } finally {
          await drivers.$cleanup();
        }
      });
    }
  });
});
