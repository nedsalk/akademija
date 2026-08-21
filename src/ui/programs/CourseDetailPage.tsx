import type { FC } from "hono/jsx";
import { routes } from "../../routes";

interface LessonListItem {
  id: string;
  isAvailable?: boolean;
  isCompleted?: boolean;
  name: string;
  position?: number;
}

export interface CourseDetailPageProps {
  attendanceRule?: number | null;
  attendanceViolations?: Array<{
    consecutiveMissedLessons: number;
    id: string;
    status: "open" | "acknowledged";
    studentName: string;
  }>;
  certificateHref?: string;
  finalAssessment?: {
    href?: string;
    retryAvailableOn?: string;
    title: string;
  } | null;
  canManageCourse: boolean;
  courseId: string;
  description: string;
  lessonList: LessonListItem[];
  name: string;
  programId: string;
  textbook?: {
    author: string;
    description: string;
    title: string;
  } | null;
  weeklyAssessment?: {
    href?: string;
    title: string;
  } | null;
  weeklyQuestionPool?: Array<{
    id: string;
    text: string;
  }>;
  finalQuestionPool?: Array<{
    id: string;
    text: string;
  }>;
}

export const CourseDetailPage: FC<CourseDetailPageProps> = ({
  attendanceRule,
  attendanceViolations = [],
  canManageCourse,
  certificateHref,
  courseId,
  description,
  finalAssessment,
  finalQuestionPool = [],
  lessonList,
  name,
  programId,
  textbook,
  weeklyAssessment,
  weeklyQuestionPool = [],
}) => {
  const courseRoute = routes.programs.$(programId).courses.$(courseId);

  return (
    <div>
      <a href={routes.programs.$(programId).toString()}>&lt;- Program</a>
      <h1>{name}</h1>
      {canManageCourse ? (
        <form method="post" action={courseRoute.$delete}>
          <button type="submit">Izbriši kurs</button>
        </form>
      ) : null}
      {description ? <p>{description}</p> : null}

      <section>
        <h2>Textbook</h2>
        {textbook ? (
          <dl>
            <dt>Title</dt>
            <dd>{textbook.title}</dd>
            <dt>Author</dt>
            <dd>{textbook.author}</dd>
            <dt>Description</dt>
            <dd>{textbook.description}</dd>
          </dl>
        ) : (
          <p>No textbook assigned.</p>
        )}
      </section>

      {canManageCourse ? (
        <section>
          <h2>Dodaj knjigu</h2>
          <form method="post" action={courseRoute.$textbook}>
            <label>
              Autor
              <input type="text" name="author" required />
            </label>
            <label>
              Naslov
              <input type="text" name="title" required />
            </label>
            <label>
              Description
              <textarea name="description" required></textarea>
            </label>
            <button type="submit">Dodaj</button>
          </form>
        </section>
      ) : null}

      {canManageCourse ? (
        <section>
          <h2>Attendance</h2>
          <form method="post" action={courseRoute.attendance.$rule}>
            <label>
              Maximum Consecutive Missed Lessons
              <input
                type="number"
                min="0"
                name="maxConsecutiveMissedLessons"
                value={String(attendanceRule ?? 0)}
                required
              />
            </label>
            <button type="submit">Save Attendance Rule</button>
          </form>
          <form method="post" action={courseRoute.attendance.$evaluate}>
            <button type="submit">Evaluate Attendance</button>
          </form>
          {attendanceViolations.length === 0 ? (
            <p>No attendance violations.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Missed Lessons</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {attendanceViolations.map((violation) => (
                  <tr>
                    <th scope="row">{violation.studentName}</th>
                    <td>Missed {violation.consecutiveMissedLessons}</td>
                    <td>{violation.status}</td>
                    <td>
                      <form method="post">
                        <button
                          type="submit"
                          formaction={`${courseRoute.attendance.$acknowledge}?violationId=${violation.id}`}
                        >
                          Acknowledge
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {canManageCourse ? (
        <section>
          <h2>Publish Weekly Test</h2>
          <form method="post" action={courseRoute.assessments.$weekly}>
            <label>
              Opens On
              <input type="date" name="opensOn" />
            </label>
            <label>
              Closes On
              <input type="date" name="closesOn" />
            </label>
            <fieldset>
              <legend>Questions</legend>
              {weeklyQuestionPool.length === 0 ? (
                <p>No weekly questions available.</p>
              ) : (
                <ul>
                  {weeklyQuestionPool.map((question) => (
                    <li>
                      <label>
                        <input checked name="questionId" type="checkbox" value={question.id} />
                        {question.text}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>
            <button type="submit">Publish Weekly Test</button>
          </form>
        </section>
      ) : null}

      {canManageCourse ? (
        <section>
          <h2>Publish Final Test</h2>
          <form method="post" action={courseRoute.assessments.$final}>
            <label>
              Opens On
              <input type="date" name="opensOn" />
            </label>
            <label>
              Closes On
              <input type="date" name="closesOn" />
            </label>
            <label>
              Passing Threshold Percent
              <input type="number" min="1" max="100" name="passingThresholdPercent" value="70" />
            </label>
            <fieldset>
              <legend>Questions</legend>
              {finalQuestionPool.length === 0 ? (
                <p>No final-test questions available.</p>
              ) : (
                <ul>
                  {finalQuestionPool.map((question) => (
                    <li>
                      <label>
                        <input checked name="questionId" type="checkbox" value={question.id} />
                        {question.text}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>
            <button type="submit">Publish Final Test</button>
          </form>
        </section>
      ) : null}
      {!canManageCourse ? (
        <section>
          <h2>Assessments</h2>
          {weeklyAssessment?.href ? (
            <p>
              <a href={weeklyAssessment.href}>{weeklyAssessment.title}</a>
            </p>
          ) : (
            <p>Weekly test unavailable.</p>
          )}
          {finalAssessment?.href ? (
            <p>
              <a href={finalAssessment.href}>{finalAssessment.title}</a>
            </p>
          ) : finalAssessment?.retryAvailableOn ? (
            <p>
              Final test retry available on{" "}
              <time datetime={finalAssessment.retryAvailableOn}>
                {finalAssessment.retryAvailableOn}
              </time>
              .
            </p>
          ) : (
            <p>Final test unavailable.</p>
          )}
          {certificateHref ? (
            <p>
              <a href={certificateHref}>Download Certificate</a>
            </p>
          ) : (
            <p>Certificate unavailable.</p>
          )}
        </section>
      ) : null}

      {canManageCourse ? (
        <section>
          <h2>Dodaj predavanje</h2>
          <form method="post" action={courseRoute.$lessons}>
            <label>
              Naziv
              <input type="text" name="name" required />
            </label>
            <label>
              Video URL
              <input type="url" name="videoUrl" />
            </label>
            <button type="submit">Dodaj</button>
          </form>
        </section>
      ) : null}

      <section>
        <h2>Lessons</h2>
        {lessonList.length === 0 ? (
          <p>Kurs još nema predavanja.</p>
        ) : (
          <form method="post" action={courseRoute.lessons.$reorder}>
            <ol>
              {lessonList.map((lesson, index) => (
                <li>
                  {lesson.isAvailable === false ? (
                    <span>{lesson.name} - Locked</span>
                  ) : (
                    <a href={courseRoute.lessons.$(lesson.id).toString()}>
                      {lesson.isCompleted ? `${lesson.name} - Completed` : lesson.name}
                    </a>
                  )}
                  {canManageCourse && (
                    <>
                      <label>
                        Order
                        <input
                          type="number"
                          min="1"
                          name={`lesson-position:${lesson.id}`}
                          value={String((lesson.position ?? index) + 1)}
                          required
                        />
                      </label>
                      <a href={courseRoute.lessons.$(lesson.id).$edit}>Edit</a>
                      <button type="submit" formaction={courseRoute.lessons.$(lesson.id).$delete}>
                        Izbriši
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ol>
            {canManageCourse ? <button type="submit">Save Lesson Order</button> : null}
          </form>
        )}
      </section>
    </div>
  );
};
