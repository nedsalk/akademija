import type { Browser, BrowserContext, Page } from "playwright";
import type { User, Visitor } from "../../dsl/types";
import type { SeededUser } from "../interface";

type WaitUntilState = "load" | "domcontentloaded" | "networkidle" | "commit";

export interface SharedContext {
  baseURL: string;
  browser: Browser;
  visitors: Map<string, { page: Page; context: BrowserContext }>;
  users: Map<string, User>;
  seededUsers: SeededUser[];
}

export class PWDriver {
  constructor(protected sharedContext: SharedContext) {}

  protected getPage(visitor: Visitor) {
    // biome-ignore lint/style/noNonNullAssertion: <aasdfere>
    return this.sharedContext.visitors.get(visitor.testId)!.page;
  }

  protected waitForPath(
    page: Page,
    pathname: string,
    waitUntil: WaitUntilState = "domcontentloaded",
  ) {
    return page.waitForURL((url) => url.pathname === pathname, { waitUntil });
  }

  protected waitForAnyPath(
    page: Page,
    pathnames: string[],
    waitUntil: WaitUntilState = "domcontentloaded",
  ) {
    return page.waitForURL((url) => pathnames.includes(url.pathname), {
      waitUntil,
    });
  }

  protected async submitAndWaitForPath(args: {
    action: () => Promise<unknown>;
    page: Page;
    pathname: string;
    waitUntil?: WaitUntilState;
  }) {
    const { page, pathname, action, waitUntil = "domcontentloaded" } = args;
    await Promise.all([this.waitForPath(page, pathname, waitUntil), action()]);
  }

  protected async submitAndWaitForAnyPath(args: {
    action: () => Promise<unknown>;
    page: Page;
    pathnames: string[];
    waitUntil?: WaitUntilState;
  }) {
    const { page, pathnames, action, waitUntil = "domcontentloaded" } = args;
    await Promise.all([this.waitForAnyPath(page, pathnames, waitUntil), action()]);
  }
}
