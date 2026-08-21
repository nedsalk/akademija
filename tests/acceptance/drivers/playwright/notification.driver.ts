import { routes } from "../../../../src/routes";
import type { Course, User } from "../../dsl/types";
import type { NotificationDriver } from "../interface";
import { PWDriver } from "./base-driver";

type NotificationState = {
  notifications: Array<{
    body: string;
    dedupeKey: string;
    kind: string;
    title: string;
  }>;
  subscription: {
    endpoint: string;
  } | null;
};

export class PlaywrightNotificationDriver extends PWDriver implements NotificationDriver {
  async subscribe(user: User): Promise<void> {
    const page = this.getPage(user);
    await page.goto(routes.$profile, { waitUntil: "domcontentloaded" });
    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.getByRole("button", { name: "Enable Notifications" }).click(),
    ]);
  }

  async setCurrentDate(
    user: User,
    args: { isoDate?: string; advanceByDays?: number },
  ): Promise<void> {
    const page = this.getPage(user);
    await page.request.post(routes.api.test.$setNow, {
      data: JSON.stringify(args),
    });
  }

  async openProgram(user: User, programId: string): Promise<void> {
    const page = this.getPage(user);
    await page.goto(routes.programs.$(programId).toString(), {
      waitUntil: "networkidle",
    });
  }

  async openCourse(user: User, course: Course): Promise<void> {
    const page = this.getPage(user);
    await page.goto(routes.programs.$(course.program.id).courses.$(course.id).toString(), {
      waitUntil: "networkidle",
    });
  }

  async seesSavedSubscription(user: User): Promise<boolean> {
    const state = await this.getState(user);
    return Boolean(state.subscription?.endpoint);
  }

  async seesNotification(user: User, kind: string): Promise<boolean> {
    const state = await this.getState(user);
    return state.notifications.some((notification) => notification.kind === kind);
  }

  private async getState(user: User): Promise<NotificationState> {
    const page = this.getPage(user);
    return page.evaluate(async (path) => {
      const response = await fetch(path);
      return response.json();
    }, routes.api.test.$notifications);
  }
}
