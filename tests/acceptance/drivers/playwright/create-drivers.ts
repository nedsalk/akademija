import type { BrowserContext, Page } from "playwright";
import type { SeededUser } from "../interface";
import { PlaywrightAdminDriver } from "./admin.driver";
import { PlaywrightAssessmentDriver } from "./assessment.driver";
import { PlaywrightAttendanceDriver } from "./attendance.driver";
import { PlaywrightAuthDriver } from "./auth.driver";
import type { SharedContext } from "./base-driver";
import { PlaywrightCertificateDriver } from "./certificate.driver";
import { PlaywrightDiscussionDriver } from "./discussion.driver";
import { PlaywrightEnrollmentDriver } from "./enrollment.driver";
import { PlaywrightLessonFlowDriver } from "./lesson-flow.driver";
import { PlaywrightMcpHandoff } from "./mcp-handoff";
import { PlaywrightNotificationDriver } from "./notification.driver";
import { PlaywrightProgramDriver } from "./program.driver";
import { PlaywrightPWADriver } from "./pwa.driver";
import { PlaywrightQuestionDriver } from "./question.driver";
import { PlaywrightTeacherDriver } from "./teacher.driver";

export function createPlaywrightDrivers(page: Page, baseURL: string, seededUsers: SeededUser[]) {
  const browser = page.context().browser();
  if (!browser) {
    throw new Error("Browser not available from page context");
  }

  const visitors = new Map<string, { page: Page; context: BrowserContext }>();

  const sharedContext: SharedContext = {
    baseURL,
    browser,
    visitors,
    users: new Map(),
    seededUsers: [...seededUsers],
  };
  return {
    auth: new PlaywrightAuthDriver(sharedContext),
    admin: new PlaywrightAdminDriver(sharedContext),
    assessment: new PlaywrightAssessmentDriver(sharedContext),
    attendance: new PlaywrightAttendanceDriver(sharedContext),
    certificate: new PlaywrightCertificateDriver(sharedContext),
    discussion: new PlaywrightDiscussionDriver(sharedContext),
    notification: new PlaywrightNotificationDriver(sharedContext),
    pwa: new PlaywrightPWADriver(sharedContext),
    teacher: new PlaywrightTeacherDriver(sharedContext),
    program: new PlaywrightProgramDriver(sharedContext),
    question: new PlaywrightQuestionDriver(sharedContext),
    enrollment: new PlaywrightEnrollmentDriver(sharedContext),
    lessonFlow: new PlaywrightLessonFlowDriver(sharedContext),
    $mcp: new PlaywrightMcpHandoff(sharedContext),
    $cleanup: async () => {
      await Promise.allSettled(
        Array.from(sharedContext.visitors.values()).map(({ context }) => context.close()),
      );
      sharedContext.visitors.clear();
      sharedContext.users.clear();
      sharedContext.seededUsers.length = 0;
    },
  };
}
