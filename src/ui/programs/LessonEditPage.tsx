import type { FC } from "hono/jsx";
import { routes } from "../../routes";

interface LessonEditPageProps {
  courseId: string;
  lessonId: string;
  name: string;
  programId: string;
  videoUrl: string;
}

export const LessonEditPage: FC<LessonEditPageProps> = ({
  courseId,
  lessonId,
  name,
  programId,
  videoUrl,
}) => {
  const lessonRoute = routes.programs.$(programId).courses.$(courseId).lessons.$(lessonId);

  return (
    <div>
      <h1>Edit Lesson</h1>
      <form method="post" action={lessonRoute.$edit}>
        <label>
          Lesson Name
          <input type="text" name="name" value={name} required />
        </label>
        <label>
          Video URL
          <input type="url" name="videoUrl" value={videoUrl} />
        </label>
        <button type="submit">Update Lesson</button>
      </form>
      <a href={routes.programs.$(programId).courses.$(courseId).toString()}>Cancel</a>
    </div>
  );
};
