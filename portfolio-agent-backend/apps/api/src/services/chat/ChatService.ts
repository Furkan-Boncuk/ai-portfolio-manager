import type { AgentRunner } from "@portfolio-agent/agent-core";
import type { StreamChunk } from "@portfolio-agent/agent-core";
import { getDb } from "@portfolio-agent/db";
import { getEnv } from "@portfolio-agent/shared";
import { chatSessions, messages } from "@portfolio-agent/db/schema";
import type { ChatSession, ChatMessage, CreateSessionResult, ChatInSessionResult } from "./ChatService.types";
import { ChatRole } from "./ChatService.types";
import { truncate } from "../../utils/string";
import { eq, desc, sql } from "drizzle-orm";

export class ChatService {
  constructor(private readonly runner: AgentRunner) {}

  async listSessions(): Promise<{ data: ChatSession[] }> {
    const db = getDb();
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, getEnv().DEFAULT_USER_ID))
      .orderBy(desc(chatSessions.updatedAt));
    return { data: sessions };
  }

  async createEmptySession(): Promise<{ data: { session: ChatSession } }> {
    const db = getDb();
    const [session] = await db
      .insert(chatSessions)
      .values({ userId: getEnv().DEFAULT_USER_ID })
      .returning();
    return { data: { session: session! } };
  }

  async createSession(message: string): Promise<{ data: CreateSessionResult }> {
    const db = getDb();

    const [session] = await db
      .insert(chatSessions)
      .values({ userId: getEnv().DEFAULT_USER_ID })
      .returning();

    const [userMsg] = await db
      .insert(messages)
      .values({ sessionId: session!.id, role: ChatRole.User, content: message })
      .returning();

    const response = await this.runner.chat(message);

    const [assistantMsg] = await db
      .insert(messages)
      .values({ sessionId: session!.id, role: ChatRole.Assistant, content: response })
      .returning();

    await db
      .update(chatSessions)
      .set({ title: truncate(response), updatedAt: sql`now()` })
      .where(eq(chatSessions.id, session!.id));

    return {
      data: {
        session: session!,
        response,
        messages: [
          { id: userMsg!.id, role: ChatRole.User, content: message },
          { id: assistantMsg!.id, role: ChatRole.Assistant, content: response },
        ],
      },
    };
  }

  async getSession(sessionId: string): Promise<{ data: ChatSession } | { error: string }> {
    const db = getDb();
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));
    if (!session) return { error: "Session not found" };
    return { data: session };
  }

  async getSessionMessages(sessionId: string): Promise<{ data: ChatMessage[] }> {
    const db = getDb();
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.createdAt);
    return { data: msgs };
  }

  async chatInSession(
    sessionId: string,
    message: string,
  ): Promise<{ data: ChatInSessionResult } | { error: string }> {
    const db = getDb();

    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));
    if (!session) return { error: "Session not found" };

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.createdAt);

    const chatHistory = history.map((m) => ({
      role: m.role === ChatRole.Assistant ? ChatRole.Assistant : ChatRole.User,
      content: m.content,
    }));

    await db.insert(messages).values({
      sessionId,
      role: ChatRole.User,
      content: message,
    });

    const response = await this.runner.chat(message, chatHistory);

    const [assistantMsg] = await db
      .insert(messages)
      .values({ sessionId, role: ChatRole.Assistant, content: response })
      .returning();

    if (session.title === "New conversation" && response.length > 0) {
      await db
        .update(chatSessions)
        .set({ title: truncate(response) })
        .where(eq(chatSessions.id, sessionId));
    }

    await db
      .update(chatSessions)
      .set({ updatedAt: sql`now()` })
      .where(eq(chatSessions.id, sessionId));

    return { data: { response, message: assistantMsg! } };
  }

  async chatInSessionStream(
    sessionId: string,
    message: string,
  ): Promise<ReadableStream<Uint8Array>> {
    const db = getDb();

    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));
    if (!session) {
      return errorStream("Session not found");
    }

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.createdAt);

    const chatHistory = history.map((m) => ({
      role: m.role === ChatRole.Assistant ? ChatRole.Assistant : ChatRole.User,
      content: m.content,
    }));

    await db.insert(messages).values({
      sessionId,
      role: ChatRole.User,
      content: message,
    });

    const [savedMessage] = await db
      .insert(messages)
      .values({ sessionId, role: ChatRole.Assistant, content: "" })
      .returning();

    const encoder = new TextEncoder();
    const runner = this.runner;

    return new ReadableStream<Uint8Array>({
      start(controller) {
        let closed = false;

        const safeClose = () => {
          if (closed) return;
          closed = true;
          clearInterval(heartbeat);
          try { controller.close(); } catch { /* ignore */ }
        };

        const safeEnqueue = (data: Uint8Array) => {
          if (closed) return;
          try { controller.enqueue(data); } catch { /* ignore */ }
        };

        const sendError = (msg: string) => {
          clearInterval(heartbeat);
          safeEnqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`));
          safeClose();
        };

        safeEnqueue(encoder.encode(`event: started\ndata: ${JSON.stringify({ messageId: savedMessage!.id })}\n\n`));

        const heartbeat = setInterval(() => {
          safeEnqueue(encoder.encode(": heartbeat\n\n"));
        }, 15000);

        runner.chatStream(message, chatHistory)
          .then(async (runnerStream) => {
            clearInterval(heartbeat);
            const reader = runnerStream.getReader();
            let fullContent = "";
            let fullReasoning = "";

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done || !value) break;

                const chunk = value as StreamChunk;

                if (chunk.reasoning) {
                  fullReasoning += chunk.reasoning;
                  safeEnqueue(encoder.encode(`event: reasoning\ndata: ${JSON.stringify({ content: chunk.reasoning })}\n\n`));
                }

                if (chunk.content) {
                  fullContent += chunk.content;
                  safeEnqueue(encoder.encode(`event: content\ndata: ${JSON.stringify({ delta: chunk.content })}\n\n`));
                }

                if (chunk.done) {
                  await db
                    .update(messages)
                    .set({
                      content: fullContent,
                      metadata: fullReasoning ? { reasoning: fullReasoning.trim() } : {},
                    })
                    .where(eq(messages.id, savedMessage!.id));

                  if (session.title === "New conversation" && fullContent.length > 0) {
                    await db
                      .update(chatSessions)
                      .set({ title: truncate(fullContent) })
                      .where(eq(chatSessions.id, sessionId));
                  }

                  await db
                    .update(chatSessions)
                    .set({ updatedAt: sql`now()` })
                    .where(eq(chatSessions.id, sessionId));

                  safeEnqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ messageId: savedMessage!.id, content: fullContent, reasoning: fullReasoning })}\n\n`));
                  safeClose();
                  return;
                }
              }
              safeClose();
            } catch {
              sendError("Stream error.");
            } finally {
              reader.releaseLock();
            }
          })
          .catch(() => {
            sendError("Failed to start chat stream.");
          });
      },
    });
  }

  async updateSessionTitle(
    sessionId: string,
    title: string,
  ): Promise<{ data: ChatSession } | { error: string }> {
    const db = getDb();
    const [session] = await db
      .update(chatSessions)
      .set({ title })
      .where(eq(chatSessions.id, sessionId))
      .returning();
    if (!session) return { error: "Session not found" };
    return { data: session };
  }

  async deleteSession(sessionId: string): Promise<{ ok: true }> {
    const db = getDb();
    await db.delete(messages).where(eq(messages.sessionId, sessionId));
    await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
    return { ok: true };
  }
}

function errorStream(errorMessage: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const event = `event: error\ndata: ${JSON.stringify({ message: errorMessage })}\n\n`;
      controller.enqueue(encoder.encode(event));
      controller.close();
    },
  });
}
