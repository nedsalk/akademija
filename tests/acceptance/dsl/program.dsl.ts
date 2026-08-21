/** biome-ignore-all lint/suspicious/noThenProperty: <given-when-then> */
import type { ProgramDriver } from "../drivers/interface";
import type { AuthDSL } from "./auth.dsl";
import type {
  Course,
  Expect,
  Lesson,
  Program,
  TeacherCourse,
  TeacherLesson,
  Textbook,
  User,
} from "./types";

interface TeacherArgs {
  teacher: User;
}

type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ProgramDSL {
  given: {
    "a program": () => Promise<Program>;
    "a course": () => Promise<TeacherCourse>;
    "a course with a lesson": () => Promise<TeacherLesson>;
    "a course with multiple lessons": () => Promise<{
      teacher: User;
      course: Course;
      lessons: Lesson[];
    }>;
    "a program with a course": () => Promise<TeacherCourse>;
  };
  when: {
    "they create a program": (teacher: User) => Promise<Program>;
    "they add a course to the program": (args: {
      teacher: User;
      program: Program;
    }) => Promise<Course>;
    "teacher edits program name": (args: { teacher: User; program: Program }) => Promise<string>;
    "teacher adds a textbook to the course": (args: {
      teacher: User;
      course: Course;
    }) => Promise<Textbook>;
    "teacher adds lesson to course": (args: { teacher: User; course: Course }) => Promise<Lesson>;
    "teacher reorders lessons": (args: {
      teacher: User;
      course: Course;
      lessons: Lesson[];
    }) => Promise<Lesson[]>;
    "teacher removes the lesson": (args: { teacher: User; lesson: Lesson }) => Promise<void>;
    "teacher renames the lesson": (args: { teacher: User; lesson: Lesson }) => Promise<string>;
    "teacher sets the lesson video": (args: {
      teacher: User;
      lesson: Lesson;
      videoUrl: string;
    }) => Promise<void>;
    "they remove the course": (args: { teacher: User; course: Course }) => Promise<void>;
    "teacher approves student's enrollment": (args: {
      teacher: User;
      student: User;
      program: Program;
    }) => Promise<void>;
    "teacher attempts to approve student's enrollment": (args: {
      teacher: User;
      student: User;
      program: Program;
    }) => Promise<number>;
    "teacher rejects student's enrollment": (args: {
      teacher: User;
      student: User;
      program: Program;
    }) => Promise<void>;
  };
  then: {
    "they can see that program": (
      args: TeacherArgs & {
        program: Program;
      },
    ) => Promise<void>;
    "they can see that course in the program": (args: {
      teacher: User;
      program: Program;
      course: Course;
    }) => Promise<void>;
    "teacher can see program details": (args: { teacher: User; program: Program }) => Promise<void>;
    "teacher sees updated name": (args: {
      teacher: User;
      program: Program;
      new_name: string;
    }) => Promise<void>;
    "the textbook is assigned to the course": (args: {
      teacher: User;
      course: Course;
      textbook: Textbook;
    }) => Promise<void>;
    "they can see the lesson": (args: { teacher: User; lesson: Lesson }) => Promise<void>;
    "the new lesson order is saved": (args: {
      teacher: User;
      course: Course;
      lessons: Lesson[];
    }) => Promise<void>;
    "the lesson is removed": (args: { teacher: User; lesson: Lesson }) => Promise<void>;
    "the lesson is renamed": (args: {
      teacher: User;
      lesson: Lesson;
      new_name: string;
    }) => Promise<void>;
    "the course is removed": (args: { teacher: User; course: Course }) => Promise<void>;
    "teacher sees student enrollments in program": (args: {
      teacher: User;
      students: User[];
      program: Program;
      status: ApplicationStatus;
    }) => Promise<void>;
    "teacher sees student's enrollment details": (args: {
      teacher: User;
      student: User;
      program: Program;
    }) => Promise<void>;
    "teacher sees student's enrollment start date": (args: {
      teacher: User;
      student: User;
      program: Program;
      start_date: string;
    }) => Promise<void>;
  };
}

export function createProgramDSL(
  driver: ProgramDriver,
  authDSL: AuthDSL,
  expect: Expect,
): ProgramDSL {
  return {
    given: {
      "a program": async () => {
        const teacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        return driver.createProgram(teacher);
      },

      "a course": async () => {
        const teacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const program = await driver.createProgram(teacher);
        const course = await driver.addCourseToProgram(teacher, program);

        return { teacher, course };
      },

      "a course with a lesson": async () => {
        const teacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const program = await driver.createProgram(teacher);
        const course = await driver.addCourseToProgram(teacher, program);
        const lesson = await driver.addLessonToCourse(teacher, course);

        return { teacher, lesson };
      },

      "a course with multiple lessons": async () => {
        const teacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const program = await driver.createProgram(teacher);
        const course = await driver.addCourseToProgram(teacher, program);
        const firstLesson = await driver.addLessonToCourse(teacher, course);
        const secondLesson = await driver.addLessonToCourse(teacher, course);

        return { teacher, course, lessons: [firstLesson, secondLesson] };
      },

      "a program with a course": async () => {
        const teacher = await authDSL.given["a registered user"]({
          role: "teacher",
        });
        const program = await driver.createProgram(teacher);
        const course = await driver.addCourseToProgram(teacher, program);

        return { teacher, course };
      },
    },
    when: {
      "they create a program": async (teacher) => {
        return driver.createProgram(teacher);
      },

      "they add a course to the program": async ({ teacher, program }) => {
        return driver.addCourseToProgram(teacher, program);
      },

      "teacher edits program name": async ({ teacher, program }) => {
        const newName = `${program.name} Updated`;
        await driver.editProgramName(teacher, program, newName);

        return newName;
      },

      "teacher adds a textbook to the course": async ({ teacher, course }) => {
        return driver.addTextbookToCourse(teacher, course);
      },

      "teacher adds lesson to course": async ({ teacher, course }) => {
        return driver.addLessonToCourse(teacher, course);
      },

      "teacher reorders lessons": async ({ teacher, course, lessons }) => {
        const reorderedLessons = [lessons[1], lessons[0]].filter((lesson): lesson is Lesson =>
          Boolean(lesson),
        );
        await driver.reorderLessons(teacher, course, reorderedLessons);
        return reorderedLessons;
      },

      "teacher removes the lesson": async ({ teacher, lesson }) => {
        return driver.removeLesson(teacher, lesson);
      },

      "teacher renames the lesson": async ({ teacher, lesson }) => {
        const newName = `${lesson.name} Updated`;
        await driver.renameLesson(teacher, lesson, newName);
        return newName;
      },

      "teacher sets the lesson video": async ({ teacher, lesson, videoUrl }) => {
        await driver.setLessonVideoUrl(teacher, lesson, videoUrl);
      },

      "they remove the course": async ({ teacher, course }) => {
        return driver.removeCourse(teacher, course);
      },

      "teacher approves student's enrollment": async ({ teacher, student, program }) => {
        await driver.approveStudentEnrollment(teacher, student, program);
      },

      "teacher attempts to approve student's enrollment": async ({ teacher, student, program }) => {
        return driver.postStudentEnrollmentApproval(teacher, student, program);
      },

      "teacher rejects student's enrollment": async ({ teacher, student, program }) => {
        await driver.rejectStudentEnrollment(teacher, student, program);
      },
    },

    then: {
      "they can see that program": async ({ teacher, program }): Promise<void> => {
        const seesProgram = await driver.seesProgramOnDashboard(teacher, program);
        expect(seesProgram).toBe(true);
      },

      "they can see that course in the program": async ({
        teacher,
        program,
        course,
      }): Promise<void> => {
        const seesCourse = await driver.seesCourseInProgram(teacher, program, course);
        expect(seesCourse).toBe(true);
      },

      "teacher can see program details": async ({ teacher, program }): Promise<void> => {
        const programDetails = await driver.getProgramDetails(teacher, program);
        expect(programDetails.name).toBe(program.name);
      },

      "teacher sees updated name": async ({ teacher, program, new_name }): Promise<void> => {
        const updatedProgram = await driver.getProgramDetails(teacher, program);
        expect(updatedProgram.name).toBe(new_name);
      },

      "the textbook is assigned to the course": async ({
        teacher,
        course,
        textbook,
      }): Promise<void> => {
        const assignedTextbook = await driver.getCourseTextbook(teacher, course);
        expect(assignedTextbook?.title).toBe(textbook.title);
        expect(assignedTextbook?.author).toBe(textbook.author);
        expect(assignedTextbook?.description).toBe(textbook.description);
      },

      "they can see the lesson": async ({ teacher, lesson }): Promise<void> => {
        const seesLesson = await driver.seesLessonInCourse(teacher, lesson);
        expect(seesLesson).toBe(true);
      },

      "the new lesson order is saved": async ({ teacher, course, lessons }): Promise<void> => {
        const actualOrder = await driver.getCourseLessonNames(teacher, course);
        expect(actualOrder[0]).toBe(lessons[0]?.name);
        expect(actualOrder[1]).toBe(lessons[1]?.name);
      },

      "the lesson is removed": async ({ teacher, lesson }): Promise<void> => {
        const seesLesson = await driver.seesLessonInCourse(teacher, lesson);
        expect(seesLesson).toBe(false);
      },

      "the lesson is renamed": async ({ teacher, lesson, new_name }): Promise<void> => {
        const lessonDetails = await driver.getLessonDetails(teacher, lesson);

        expect(lessonDetails.name).toBe(new_name);
      },

      "the course is removed": async ({ teacher, course }): Promise<void> => {
        const seesCourse = await driver.seesCourseInProgram(teacher, course.program, course);
        expect(seesCourse).toBe(false);
      },

      "teacher sees student enrollments in program": async ({
        teacher,
        students,
        program,
        status,
      }): Promise<void> => {
        for (const student of students) {
          const actualStatus = await driver.getStudentEnrollmentStatusInProgram(
            teacher,
            student,
            program,
          );
          expect(actualStatus).toBe(status);
        }
      },

      "teacher sees student's enrollment details": async ({
        teacher,
        student,
        program,
      }): Promise<void> => {
        const seesDetails = await driver.seesStudentEnrollmentDetails(teacher, student, program);
        expect(seesDetails).toBe(true);
      },

      "teacher sees student's enrollment start date": async ({
        teacher,
        student,
        program,
        start_date,
      }): Promise<void> => {
        const actualStartDate = await driver.getStudentEnrollmentStartDateInProgram(
          teacher,
          student,
          program,
        );
        expect(actualStartDate).toBe(start_date);
      },
    },
  };
}
