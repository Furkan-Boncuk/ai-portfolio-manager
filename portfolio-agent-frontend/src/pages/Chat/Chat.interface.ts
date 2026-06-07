export interface Session {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string | null;
}

export interface Message {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: string;
}
