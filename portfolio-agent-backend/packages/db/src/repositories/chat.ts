import { eq, desc, asc, sql, and, ne } from "drizzle-orm";
import { getDb } from "..";
import { chatSessions, messages } from "../schema";

export async function listSessions(userId: string) {
  const db = getDb();
  return db
    .select({
      id: chatSessions.id,
      title: chatSessions.title,
      status: chatSessions.status,
      createdAt: chatSessions.createdAt,
      updatedAt: chatSessions.updatedAt,
      messageCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${messages}
        WHERE ${messages.sessionId} = ${chatSessions.id}
      )`,
      lastMessage: sql<string>`(
        SELECT ${messages.content} FROM ${messages}
        WHERE ${messages.sessionId} = ${chatSessions.id}
        ORDER BY ${messages.createdAt} DESC
        LIMIT 1
      )`,
    })
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.userId, userId),
        ne(chatSessions.status, "deleted")
      )
    )
    .orderBy(desc(chatSessions.updatedAt));
}

export async function getSessionById(id: string) {
  const db = getDb();
  const results = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, id))
    .limit(1);
  return results[0];
}

export async function createSession(data: {
  userId: string;
  title?: string;
}) {
  const db = getDb();
  const [result] = await db
    .insert(chatSessions)
    .values({
      userId: data.userId,
      title: data.title ?? "New conversation",
    })
    .returning();
  return result;
}

export async function updateSessionTitle(id: string, title: string) {
  const db = getDb();
  const [result] = await db
    .update(chatSessions)
    .set({ title, updatedAt: new Date() })
    .where(eq(chatSessions.id, id))
    .returning();
  return result;
}

export async function deleteSession(id: string) {
  const db = getDb();
  await db
    .update(chatSessions)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(eq(chatSessions.id, id));
}

export async function getMessages(sessionId: string) {
  const db = getDb();
  return db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(asc(messages.createdAt));
}

export async function insertMessage(data: {
  sessionId: string;
  role: string;
  content: string;
}) {
  const db = getDb();
  const [result] = await db.insert(messages).values(data).returning();
  return result;
}

export async function updateSessionTimestamp(id: string) {
  const db = getDb();
  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, id));
}
