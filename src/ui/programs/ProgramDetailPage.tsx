import type { FC } from "hono/jsx";
import { routes } from "../../routes";

interface LessonListItem {
  id: string;
  name: string;
  isAvailable: boolean;
  isCompleted?: boolean;
}

interface CourseListItem {
  id: string;
  name: string;
  description: string;
  lessons: LessonListItem[];
}

export interface ProgramDetailPageProps {
  canManageProgram: boolean;
  courseList: CourseListItem[];
  description: string;
  id: string;
  name: string;
}

export const ProgramDetailPage: FC<ProgramDetailPageProps> = ({
  canManageProgram,
  courseList,
  description,
  id,
  name,
}) => {
  return (
    <>
      <h1>{name}</h1>
      <a href={routes.$programs}>&lt;- programi</a>
      {description ? <p>{description}</p> : null}

      {canManageProgram ? (
        <section>
          <h2>Edit Program</h2>
          <form method="post" action={routes.programs.$(id).$edit}>
            <label>
              Program Name
              <input type="text" name="name" value={name} required />
            </label>
            <label>
              Description
              <textarea name="description">{description}</textarea>
            </label>
            <button type="submit">Update Program</button>
          </form>
        </section>
      ) : null}

      <section>
        <h2>Courses</h2>

        {courseList.length === 0 ? (
          <p>No courses yet.</p>
        ) : (
          <ul>
            {courseList.map((course) => (
              <li>
                <a href={routes.programs.$(id).courses.$(course.id).toString()}>{course.name}</a>
                {course.description ? <p>{course.description}</p> : null}
                {course.lessons.length > 0 ? (
                  <ul>
                    {course.lessons.map((lesson) => (
                      <li>
                        {!lesson.isAvailable ? (
                          <span>{lesson.name} - Locked</span>
                        ) : (
                          <a
                            href={routes.programs
                              .$(id)
                              .courses.$(course.id)
                              .lessons.$(lesson.id)
                              .toString()}
                          >
                            {lesson.isCompleted ? `${lesson.name} - Completed` : lesson.name}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManageProgram && (
        <section>
          <details>
            <summary>Dodaj kurs</summary>
            <form method="post" action={routes.programs.$(id).$courses}>
              <label for="name">Ime</label>
              <input type="text" name="name" required placeholder="..." />
              <button type="submit">Dodaj</button>
            </form>
          </details>
        </section>
      )}
    </>
  );
};
