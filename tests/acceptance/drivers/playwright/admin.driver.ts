import { routes } from "../../../../src/routes";
import type { User } from "../../dsl/types";
import type { AdminDriver, UserInfo } from "../interface";
import { PWDriver } from "./base-driver";

export class PlaywrightAdminDriver extends PWDriver implements AdminDriver {
  async seesAccessDenied(user: User): Promise<boolean> {
    const page = this.getPage(user);
    const heading = await page.locator("h1").textContent();
    return heading?.includes("Access Denied") ?? false;
  }
  async navigateToUserManagement(admin: User): Promise<void> {
    const page = this.getPage(admin);
    // routes.admin.$users is an object, not a string
    // The base path for admin users is /admin/users
    await page.goto(routes.admin.$users, { waitUntil: "domcontentloaded" });
  }

  async isOnUserManagement(admin: User): Promise<boolean> {
    const page = this.getPage(admin);

    const currentUrl = new URL(page.url());
    return currentUrl.pathname === routes.admin.$users;
  }

  async getUsersList(admin: User): Promise<UserInfo[]> {
    const page = this.getPage(admin);

    const rows = await page.locator("table tbody tr").all();
    const users: UserInfo[] = [];

    for (const row of rows) {
      const cells = await row.locator("td").all();

      if (cells.length >= 4) {
        const id = (await row.locator('th[scope="row"]').textContent())?.trim() || "";
        const email = (await cells[0]?.textContent())?.trim() || "";
        const role = (await cells[2]?.textContent())?.trim() || "";

        users.push({ id, email, role });
      }
    }

    return users;
  }

  async changeUserRole(admin: User, targetUser: User, newRole: string): Promise<void> {
    const page = this.getPage(admin);

    const onUserManagement = await this.isOnUserManagement(admin);
    if (!onUserManagement) {
      await this.navigateToUserManagement(admin);
    }

    const rows = await page.locator("table tbody tr").all();

    for (const row of rows) {
      const emailCell = await row.locator("td").nth(0).textContent();

      if (emailCell?.trim() === targetUser.email) {
        await row.locator('select[name="role"]').selectOption(newRole);
        await this.submitAndWaitForPath({
          action: () => row.locator('button[type="submit"]').click(),
          page,
          pathname: routes.admin.$users,
          waitUntil: "networkidle",
        });
        return;
      }
    }

    throw new Error(`User with email ${targetUser.email} not found in user management table`);
  }

  async navigateToAdminDashboard(user: User): Promise<void> {
    const page = this.getPage(user);
    await page.goto(routes.$admin, { waitUntil: "domcontentloaded" });
  }

  async seesAdminDashboard(user: User): Promise<boolean> {
    const page = this.getPage(user);
    const heading = await page.locator("h1").textContent();
    return heading?.includes("Admin Dashboard") ?? false;
  }
}
