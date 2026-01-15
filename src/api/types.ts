// api/types.ts - Public API types for Copilot Chat Secretary
// These types are exported for use by external extensions

import type { DialogStatusType } from "copilot-chat-analyzer";

/**
 * Response from copilotChatSecretary.api.getStatus command
 */
export interface ChatStatusResponse {
  /** Current dialog status */
  status: DialogStatusType;
  /** Current session ID, or null if no active session */
  sessionId: string | null;
  /** Number of requests in current session */
  requestsCount: number;
  /** Unix timestamp (ms) of last status update */
  lastUpdate: number;
  /** Whether chat has activity */
  isActive: boolean;
}

/**
 * Response from copilotChatSecretary.api.getCurrentDialog and getSession commands
 */
export interface DialogSessionResponse {
  /** Unique session identifier */
  sessionId: string;
  /** Current status of the dialog */
  status: string;
  /** Unix timestamp (ms) when session was first seen */
  firstSeen: number;
  /** Unix timestamp (ms) when session was last updated */
  lastSeen: number;
  /** Number of requests in this session */
  requestsCount: number;
  /** First 80 characters of the first user message */
  firstRequestPreview: string;
  /** Agent ID if available */
  agentId?: string;
  /** Model ID if available */
  modelId?: string;
}

/**
 * Options for copilotChatSecretary.api.getDialogHistory command
 */
export interface GetDialogHistoryOptions {
  /** Maximum number of results to return (default: 100) */
  limit?: number;
  /** Filter by dialog status */
  status?: string;
}

/**
 * Options for copilotChatSecretary.api.getSession command
 */
export interface GetSessionOptions {
  /** Session ID to retrieve */
  sessionId: string;
}
