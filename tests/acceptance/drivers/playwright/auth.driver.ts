import { routes } from "../../../../src/routes";
import type { User, UserRole, Visitor } from "../../dsl/types";
import type { AcquireRegisteredUserOptions, AuthDriver, RegistrationData } from "../interface";
import { PWDriver } from "./base-driver";

export class PlaywrightAuthDriver extends PWDriver implements AuthDriver {
  async createVisitor(): Promise<Visitor> {
    const visitor: Visitor = {
      testId: crypto.randomUUID(),
    };

    // Create a new browser context for this visitor
    const context = await this.sharedContext.browser.newContext({
      baseURL: this.sharedContext.baseURL,
    });
    const page = await context.newPage();

    this.sharedContext.visitors.set(visitor.testId, {
      context,
      page,
    });

    return visitor;
  }

  async acquireRegisteredUser({
    role = "student",
    authenticated = true,
  }: AcquireRegisteredUserOptions = {}): Promise<User> {
    const identityIndex = this.sharedContext.seededUsers.findIndex(
      (candidate) => candidate.role === role,
    );

    if (identityIndex === -1) {
      throw new Error(`No unclaimed seeded user with role "${role}"`);
    }

    const [identity] = this.sharedContext.seededUsers.splice(identityIndex, 1);
    if (!identity) {
      throw new Error(`Failed to acquire seeded user with role "${role}"`);
    }

    const visitor = await this.createVisitor();
    const user: User = { ...visitor, ...identity };
    this.sharedContext.users.set(user.testId, user);

    if (authenticated) {
      const actor = this.sharedContext.visitors.get(visitor.testId);
      if (!actor) {
        throw new Error(`No browser context for actor "${visitor.testId}"`);
      }

      await actor.context.addCookies([
        {
          ...identity.sessionCookie,
          url: this.sharedContext.baseURL,
        },
      ]);
    }

    return user;
  }

  async getRegistrationFormValues(visitor: Visitor): Promise<RegistrationData> {
    const page = this.getPage(visitor);

    const name = (await page.locator(`input[name="name"]`).first().inputValue()) || "";
    const email = (await page.locator(`input[name="email"]`).first().inputValue()) || "";

    const password = (await page.locator(`input[name="password"]`).first().inputValue()) || "";

    const phone = (await page.locator(`input[name="phone"]`).first().inputValue()) || "";

    return {
      name,
      email,
      password,
      phone,
    };
  }

  async register({
    email = `${crypto.randomUUID()}@email.com`,
    password = "ValidPass123!",
    name = "Test User",
    phone = "+38761123456",
    role,
  }: Partial<RegistrationData> = {}): Promise<User> {
    const visitor = await this.createVisitor();

    const page = this.getPage(visitor);

    await page.goto(routes.auth.$register, { waitUntil: "domcontentloaded" });

    // Fill registration form (all required fields)
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="phone"]', phone);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await this.submitAndWaitForPath({
      action: () => page.click('button[type="submit"]'),
      page,
      pathname: routes.$home,
    });

    const currentUrl = new URL(page.url());
    if (currentUrl.pathname !== routes.$home) {
      throw new Error("shouldn't happen!");
    }

    const response = await page.request.get(routes.api.test.$getSession);
    const sessionData = await response.json();

    const user: User = Object.assign(visitor, {
      name,
      email,
      phone,
      password,
      id: sessionData.user.id,
      role: role as UserRole | undefined,
    });

    if (role) {
      await page.request.post(routes.api.test.$setRole, {
        data: JSON.stringify({
          id: user.id,
          role,
        }),
      });
    }

    // needed for Playwright MCP handoff
    this.sharedContext.users.set(user.testId, user);

    return user;
  }

  async failRegistration(
    data: {
      email: string;
      password: string;
      name: string;
      phone: string;
    },
    visitor: Visitor,
  ): Promise<void> {
    const page = this.getPage(visitor);
    await page.goto(routes.auth.$register, { waitUntil: "domcontentloaded" });

    // Fill only the provided fields (even if empty)
    await page.fill('input[name="name"]', data.name);
    await page.fill('input[name="phone"]', data.phone);
    await page.fill('input[name="email"]', data.email);
    await page.fill('input[name="password"]', data.password);
    await this.submitAndWaitForPath({
      action: () => page.click('button[type="submit"]'),
      page,
      pathname: routes.auth.$register,
    });

    // Check if we failed registration (still on same url)
    const currentUrl = new URL(page.url());

    if (currentUrl.pathname !== routes.auth.$register) {
      throw new Error("shouldn't happen!");
    }
  }

  async login(user: User): Promise<void> {
    const page = this.getPage(user);

    await page.goto(routes.auth.$login, { waitUntil: "domcontentloaded" });

    // Fill login form
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await this.submitAndWaitForAnyPath({
      action: () => page.click('button[type="submit"]'),
      page,
      pathnames: [routes.$home, routes.auth.$login],
    });
  }

  async isAuthenticated(visitor: Visitor): Promise<boolean> {
    const page = this.getPage(visitor);
    const response = await page.request.get(routes.api.test.$getSession);
    if (response.status() !== 200) {
      return false;
    }

    const sessionData = await response.json();
    return Boolean(sessionData?.user?.id);
  }

  async getRegistrationError(visitor: Visitor): Promise<string | null> {
    const page = this.getPage(visitor);
    // Find any error span within any label on the registration form
    // Check all possible field error spans
    const errorSpan = page.locator("label > span");
    const errorCount = await errorSpan.count();

    if (errorCount === 0) {
      return null;
    }

    // Return the first error text found
    return await errorSpan.first().textContent();
  }

  async getLoginError(visitor: Visitor): Promise<string | null> {
    const page = this.getPage(visitor);
    // Find the error div with auth-error class
    const errorDiv = page.locator(".auth-error");
    const errorCount = await errorDiv.count();

    if (errorCount === 0) {
      return null;
    }

    // Return the error text
    return await errorDiv.textContent();
  }

  async logout(user: User): Promise<void> {
    const page = this.getPage(user);

    // Navigate to home page where logout button is available
    await page.goto(routes.$home, { waitUntil: "domcontentloaded" });

    // Find and click the logout button
    const logoutButton = page.locator(
      `form[action="${routes.auth.$logout}"] > button[type="submit"]`,
    );

    await this.submitAndWaitForPath({
      action: () => logoutButton.click(),
      page,
      pathname: routes.auth.$login,
    });
  }

  async isOnLoginPage(visitor: Visitor): Promise<boolean> {
    const page = this.getPage(visitor);

    // Check if the current URL is the login page
    const currentUrl = new URL(page.url());
    return currentUrl.pathname === routes.auth.$login;
  }

  async getUserRole(user: User): Promise<string | null> {
    const page = this.getPage(user);

    // Fetch the session data to get the role
    const response = await page.request.get(routes.api.test.$getSession);
    if (!response || response.status() !== 200) {
      return null;
    }

    const sessionData = await response.json();
    return sessionData?.user?.role || null;
  }
}
