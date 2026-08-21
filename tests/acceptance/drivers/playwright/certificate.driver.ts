import { readFile } from "fs/promises";
import { routes } from "../../../../src/routes";
import type { Course, Program, User } from "../../dsl/types";
import type { CertificateDriver } from "../interface";
import { PWDriver } from "./base-driver";

export class PlaywrightCertificateDriver extends PWDriver implements CertificateDriver {
  async seesCertificateAvailable(student: User): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.getByRole("link", { name: "Download Certificate" }).count()) > 0;
  }

  async seesCertificateUnavailable(student: User): Promise<boolean> {
    const page = this.getPage(student);
    return (await page.getByText("Certificate unavailable.").count()) > 0;
  }

  async downloadCertificate(student: User): Promise<string> {
    const page = this.getPage(student);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download Certificate" }).click(),
    ]);
    const path = await download.path();
    if (!path) {
      throw new Error("Download path missing");
    }
    return readFile(path, "utf8");
  }

  async getCertificateStatus(args: {
    student: User;
    program: Program;
    course: Course;
  }): Promise<number> {
    const page = this.getPage(args.student);
    const response = await page.request.get(
      routes.programs.$(args.program.id).courses.$(args.course.id).$certificate,
      { maxRedirects: 0 },
    );

    return response.status();
  }
}
