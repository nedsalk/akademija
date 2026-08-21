/** biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { TeacherDriver } from "../drivers/interface";
import type { Expect, Visitor } from "./types";

interface VisitorArgs {
  visitor: Visitor;
}

export interface TeacherDSL {
  when: {
    "they go to the teacher dashboard": (visitor: Visitor) => Promise<void>;
  };
  then: {
    "they see teacher dashboard": (args: VisitorArgs) => Promise<void>;
    "they are denied access": (args: VisitorArgs) => Promise<void>;
  };
}

export function createTeacherDSL(driver: TeacherDriver, expect: Expect): TeacherDSL {
  return {
    when: {
      "they go to the teacher dashboard": async (visitor) => {
        await driver.navigateToTeacherDashboard(visitor);
      },
    },

    then: {
      "they see teacher dashboard": async ({ visitor }): Promise<void> => {
        const seesTeacherDashboard = await driver.seesTeacherDashboard(visitor);
        expect(seesTeacherDashboard).toBe(true);
      },

      "they are denied access": async ({ visitor }): Promise<void> => {
        const accessDenied = await driver.seesAccessDenied(visitor);
        expect(accessDenied).toBe(true);
      },
    },
  };
}
