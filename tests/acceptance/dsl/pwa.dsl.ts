/* biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { PWADriver } from "../drivers/interface";
import type { AuthDSL } from "./auth.dsl";
import type { Expect, Visitor } from "./types";

interface PwaVisitorArgs {
  visitor: Visitor;
}

export interface PWADSL {
  given: {
    "the application shell": () => Promise<PwaVisitorArgs>;
    "a first-time browser visit": () => Promise<PwaVisitorArgs>;
    "the application shell in Chromium": () => Promise<PwaVisitorArgs>;
  };
  then: {
    "the web manifest exposes install metadata": (args: PwaVisitorArgs) => Promise<void>;
    "a service worker is registered": (args: PwaVisitorArgs) => Promise<void>;
    "the app meets installability prerequisites": (args: PwaVisitorArgs) => Promise<void>;
  };
}

export function createPWADSL(driver: PWADriver, authDSL: AuthDSL, expect: Expect): PWADSL {
  async function createShellVisitor() {
    const visitor = await authDSL.given["a visitor"]();
    await driver.openShell(visitor);
    return { visitor };
  }

  return {
    given: {
      "the application shell": async () => createShellVisitor(),
      "a first-time browser visit": async () => createShellVisitor(),
      "the application shell in Chromium": async () => createShellVisitor(),
    },
    then: {
      "the web manifest exposes install metadata": async ({ visitor }) => {
        expect(await driver.seesInstallManifest(visitor)).toBe(true);
      },
      "a service worker is registered": async ({ visitor }) => {
        expect(await driver.seesServiceWorkerRegistration(visitor)).toBe(true);
      },
      "the app meets installability prerequisites": async ({ visitor }) => {
        expect(await driver.seesInstallabilityPrerequisites(visitor)).toBe(true);
      },
    },
  };
}
