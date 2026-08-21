import type { FC } from "hono/jsx";
import { routes } from "../../routes";

type EnrollmentStatus = "pending" | "approved" | "rejected";

interface EnrollmentRequestItem {
  programId: string;
  programName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  status: EnrollmentStatus;
  startsOn?: string;
}

export interface EnrollmentsPageProps {
  enrollmentRequests: EnrollmentRequestItem[];
}

export const EnrollmentsPage: FC<EnrollmentsPageProps> = ({ enrollmentRequests }) => {
  return (
    <div>
      <h1>Enrollments</h1>

      <table>
        <thead>
          <tr>
            <th>Program</th>
            <th>Student</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Start date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {enrollmentRequests.map((item) => (
            <tr>
              <td>{item.programName}</td>
              <td>{item.studentName}</td>
              <td>{item.studentEmail}</td>
              <td>{item.studentPhone ?? "Not provided"}</td>
              <td>{item.status === "approved" ? "active" : item.status}</td>
              <td>{item.startsOn ? <time datetime={item.startsOn}>{item.startsOn}</time> : "-"}</td>
              <td>
                {item.status === "pending" ? (
                  <form method="post">
                    <button
                      type="submit"
                      formaction={
                        routes.enrollments.$(item.programId).enrollmentRequests.$(item.studentId)
                          .$approve
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="submit"
                      formaction={
                        routes.enrollments.$(item.programId).enrollmentRequests.$(item.studentId)
                          .$reject
                      }
                    >
                      Reject
                    </button>
                  </form>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
