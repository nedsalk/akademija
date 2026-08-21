import type { FC } from "hono/jsx";
import { routes } from "../../routes";

type RequestStatus = "pending" | "approved" | "rejected";

export interface ProgramListItem {
  id: string;
  name: string;
  description: string;
  isOwnedByViewer: boolean;
  requestStatus?: RequestStatus;
  enrollmentStart?: string;
}

interface ProgramsPageProps {
  canManagePrograms: boolean;
  programs: ProgramListItem[];
  ownedPrograms: ProgramListItem[];
}

export const ProgramsPage: FC<ProgramsPageProps> = ({
  canManagePrograms,
  programs,
  ownedPrograms,
}) => {
  const visiblePrograms = canManagePrograms ? ownedPrograms : programs;

  return (
    <div>
      <h1>Programs</h1>

      <section>
        {visiblePrograms.length === 0 ? (
          <p>
            {canManagePrograms
              ? "You are not managing any programs yet."
              : "No programs are available."}
          </p>
        ) : (
          <ul>
            {visiblePrograms.map((program) => (
              <li>
                <a href={`${routes.programs.$(program.id)}`}>{program.name}</a>
                {program.requestStatus ? <p>Enrollment status: {program.requestStatus}</p> : null}
                {!canManagePrograms && !program.requestStatus && !program.enrollmentStart ? (
                  <form method="post" action={routes.programs.$(program.id).$enroll}>
                    <button type="submit">Request enrollment</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManagePrograms && (
        <section>
          <details>
            <summary>Create new program</summary>
            <form method="post" action={routes.$programs}>
              <label for="name">Program name</label>
              <input type="text" name="name" required placeholder="..." />
              <button type="submit">Create Program</button>
            </form>
          </details>
        </section>
      )}
    </div>
  );
};
