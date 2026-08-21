import { routes } from "../../../../src/routes";
import type { Visitor } from "../../dsl/types";
import type { PWADriver } from "../interface";
import { PWDriver } from "./base-driver";

export class PlaywrightPWADriver extends PWDriver implements PWADriver {
  async openShell(visitor: Visitor): Promise<void> {
    const page = this.getPage(visitor);
    await page.goto(routes.home.toString(), { waitUntil: "networkidle" });
  }

  async seesInstallManifest(visitor: Visitor): Promise<boolean> {
    const page = this.getPage(visitor);

    return page.evaluate(async () => {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (!(manifestLink instanceof HTMLLinkElement) || !manifestLink.href) {
        return false;
      }

      const response = await fetch(manifestLink.href);
      if (!response.ok) {
        return false;
      }

      const manifest = await response.json();
      return Boolean(
        manifest.name &&
        manifest.short_name &&
        manifest.start_url &&
        manifest.display &&
        Array.isArray(manifest.icons) &&
        manifest.icons.length > 0,
      );
    });
  }

  async seesServiceWorkerRegistration(visitor: Visitor): Promise<boolean> {
    const page = this.getPage(visitor);

    return page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      return Boolean(registration.active?.scriptURL.includes("service-worker.js"));
    });
  }

  async seesInstallabilityPrerequisites(visitor: Visitor): Promise<boolean> {
    const page = this.getPage(visitor);

    return page.evaluate(async () => {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (!(manifestLink instanceof HTMLLinkElement) || !themeColor) {
        return false;
      }

      const response = await fetch(manifestLink.href);
      if (!response.ok) {
        return false;
      }

      const manifest = await response.json();
      const registration = await navigator.serviceWorker.ready;

      return Boolean(
        manifest.name &&
        manifest.short_name &&
        manifest.display === "standalone" &&
        manifest.start_url &&
        Array.isArray(manifest.icons) &&
        manifest.icons.length > 0 &&
        registration.active &&
        themeColor.getAttribute("content"),
      );
    });
  }
}
