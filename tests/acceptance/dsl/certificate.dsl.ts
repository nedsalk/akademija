/** biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { CertificateDriver } from "../drivers/interface";
import type { AssessmentDSL } from "./assessment.dsl";
import type { EnrollmentDSL } from "./enrollment.dsl";
import type { ProgramDSL } from "./program.dsl";
import type { Expect, Program, StudentProgramCourse } from "./types";

interface StudentCertificateArgs extends StudentProgramCourse {
  certificateText?: string;
}

interface CrossProgramCertificateArgs extends StudentCertificateArgs {
  enrolledProgram: Program;
}

interface CertificateAvailabilityResult extends CrossProgramCertificateArgs {
  status: number;
}

export interface CertificateDSL {
  given: {
    "a student who passed the final test": () => Promise<StudentCertificateArgs>;
    "a student who has not passed the final test": () => Promise<StudentCertificateArgs>;
    "a student enrolled in one program after passing a final test in another program": () => Promise<CrossProgramCertificateArgs>;
  };
  when: {
    "they download their certificate": (
      args: StudentCertificateArgs,
    ) => Promise<StudentCertificateArgs>;
    "they download a certificate for the passed course from the other program": (
      args: CrossProgramCertificateArgs,
    ) => Promise<CertificateAvailabilityResult>;
  };
  then: {
    "the certificate PDF contains the required completion data": (
      args: StudentCertificateArgs,
    ) => Promise<void>;
    "certificate download is unavailable": (args: StudentCertificateArgs) => Promise<void>;
    "the certificate is unavailable": (args: CertificateAvailabilityResult) => Promise<void>;
  };
}

export function createCertificateDSL(
  driver: CertificateDriver,
  assessmentDSL: AssessmentDSL,
  enrollmentDSL: EnrollmentDSL,
  programDSL: ProgramDSL,
  expect: Expect,
): CertificateDSL {
  return {
    given: {
      "a student who passed the final test": async () => {
        const args = await assessmentDSL.given["a student who passed an available final test"]();
        await assessmentDSL.when["the student opens the course"](args);
        return args;
      },
      "a student who has not passed the final test": async () => {
        return assessmentDSL.given[
          "a student who completed a course book with a published final test"
        ]();
      },
      "a student enrolled in one program after passing a final test in another program":
        async () => {
          const args = await assessmentDSL.given["a student who passed an available final test"]();
          await assessmentDSL.when["the student opens the course"](args);
          const enrolledProgram = await programDSL.given["a program"]();
          await enrollmentDSL.when["student requests program enrollment"]({
            student: args.student,
            program: enrolledProgram,
          });
          await programDSL.when["teacher approves student's enrollment"]({
            teacher: enrolledProgram.teacher,
            student: args.student,
            program: enrolledProgram,
          });

          return { ...args, enrolledProgram };
        },
    },
    when: {
      "they download their certificate": async (args) => {
        const certificateText = await driver.downloadCertificate(args.student);
        return { ...args, certificateText };
      },
      "they download a certificate for the passed course from the other program": async (args) => {
        return {
          ...args,
          status: await driver.getCertificateStatus({
            student: args.student,
            program: args.enrolledProgram,
            course: args.course,
          }),
        };
      },
    },
    then: {
      "the certificate PDF contains the required completion data": async ({
        student,
        course,
        certificateText,
      }) => {
        expect(Boolean(certificateText?.includes("Akademija Ibn Usejmin Certificate"))).toBe(true);
        expect(Boolean(certificateText?.includes(`Student: ${student.name}`))).toBe(true);
        expect(Boolean(certificateText?.includes(`Book title: ${course.name}`))).toBe(true);
        expect(Boolean(certificateText?.includes("Completion date:"))).toBe(true);
        expect(Boolean(certificateText?.includes("Teacher signature:"))).toBe(true);
      },
      "certificate download is unavailable": async ({ student }) => {
        expect(await driver.seesCertificateUnavailable(student)).toBe(true);
      },
      "the certificate is unavailable": async ({ status }) => {
        expect(status).toBe(404);
      },
    },
  };
}
