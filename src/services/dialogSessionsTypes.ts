// services/dialogSessionsTypes.ts
import { DialogStatusType } from "copilot-chat-analyzer";

/**
 * Record of a processed dialog session, persisted in globalState
 */
export interface DialogSessionRecord {
  /** Unique session identifier (UUID v4) */
  sessionId: string;
  /** Timestamp when session was first seen (Unix ms) */
  firstSeen: number;
  /** Timestamp when session was last updated (Unix ms) */
  lastSeen: number;
  /** Number of requests in this session */
  requestsCount: number;
  /** Current status of the dialog */
  status: DialogStatusType;
  /** First 80 characters of the first user message */
  firstRequestPreview: string;
  /** Agent ID if available (e.g., "github.copilot.editsAgent") */
  agentId?: string;
  /** Model ID if available (e.g., "copilot/gemini-2.5-pro") */
  modelId?: string;
}

/**
 * Service interface for managing dialog session history
 */
export interface DialogSessionsService {
  /** Get the current active session ID */
  getCurrentSessionId(): string | null;
  /** Get all recorded session history */
  getSessionHistory(): DialogSessionRecord[];
  /** Record or update a session */
  recordSession(record: DialogSessionRecord): void;
  /** Clear all session history */
  clearHistory(): void;
  /** Get a specific session by ID */
  getSession(sessionId: string): DialogSessionRecord | undefined;
}
