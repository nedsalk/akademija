import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { lessonDiscussion, user } from "../db/schema";
import { now } from "../domain/clock";

export interface DiscussionThread {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  parentId: string | null;
  status: "pending" | "approved" | "rejected";
  replies: DiscussionThread[];
}

export async function addLessonDiscussion(args: {
  authorId: string;
  body: string;
  lessonId: string;
  parentId?: string | null;
  status?: "pending" | "approved" | "rejected";
}) {
  if (args.parentId) {
    const parent = await db.query.lessonDiscussion.findFirst({
      where: and(
        eq(lessonDiscussion.id, args.parentId),
        eq(lessonDiscussion.lessonId, args.lessonId),
      ),
    });
    if (!parent) {
      return null;
    }
  }

  const currentTime = now();
  const [created] = await db
    .insert(lessonDiscussion)
    .values({
      authorId: args.authorId,
      body: args.body,
      lessonId: args.lessonId,
      parentId: args.parentId ?? null,
      status: args.status ?? "pending",
      createdAt: currentTime,
      updatedAt: currentTime,
    })
    .returning();

  return created ?? null;
}

export async function approveLessonDiscussion(args: { id: string; lessonId: string }) {
  const [updatedDiscussion] = await db
    .update(lessonDiscussion)
    .set({
      status: "approved",
      updatedAt: now(),
    })
    .where(and(eq(lessonDiscussion.id, args.id), eq(lessonDiscussion.lessonId, args.lessonId)))
    .returning({ id: lessonDiscussion.id });

  return Boolean(updatedDiscussion);
}

export async function getLessonDiscussions(lessonId: string) {
  const items = await db
    .select({
      id: lessonDiscussion.id,
      authorId: lessonDiscussion.authorId,
      authorName: user.name,
      authorRole: user.role,
      body: lessonDiscussion.body,
      parentId: lessonDiscussion.parentId,
      status: lessonDiscussion.status,
      createdAt: lessonDiscussion.createdAt,
    })
    .from(lessonDiscussion)
    .innerJoin(user, eq(lessonDiscussion.authorId, user.id))
    .where(eq(lessonDiscussion.lessonId, lessonId))
    .orderBy(asc(lessonDiscussion.createdAt));

  const byParentId = new Map<string | null, typeof items>();
  for (const item of items) {
    const parentItems = byParentId.get(item.parentId) ?? [];
    parentItems.push(item);
    byParentId.set(item.parentId, parentItems);
  }

  const toTree = (parentId: string | null): DiscussionThread[] =>
    (byParentId.get(parentId) ?? []).map((item) => ({
      id: item.id,
      authorId: item.authorId,
      authorName: item.authorName,
      authorRole: item.authorRole,
      body: item.body,
      parentId: item.parentId,
      status: item.status,
      replies: toTree(item.id),
    }));

  return toTree(null);
}

export function filterApprovedDiscussions(threads: DiscussionThread[]): DiscussionThread[] {
  return threads
    .filter((thread) => thread.status === "approved")
    .map((thread) => ({
      ...thread,
      replies: filterApprovedDiscussions(thread.replies),
    }));
}

export function filterStudentVisibleDiscussions(
  threads: DiscussionThread[],
  studentId: string,
): DiscussionThread[] {
  return threads
    .filter((thread) => {
      return (
        thread.status === "approved" ||
        (thread.status === "pending" && thread.authorId === studentId)
      );
    })
    .map((thread) => {
      return {
        ...thread,
        replies:
          thread.status === "approved"
            ? filterStudentVisibleDiscussions(thread.replies, studentId)
            : [],
      };
    });
}
