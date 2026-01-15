// services/dialogSessionsService.ts
import * as vscode from "vscode";
import {
  DialogSessionRecord,
  DialogSessionsService,
} from "./dialogSessionsTypes";

const STORAGE_KEY = "copilotChatSecretary.dialogSessions";
const MAX_HISTORY_SIZE = 100; // Keep last 100 sessions

/**
 * Service for managing dialog session history using VS Code globalState
 */
export class DialogSessionsServiceImpl implements DialogSessionsService {
  private currentSessionId: string | null = null;
  private sessions: Map<string, DialogSessionRecord> = new Map();
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadFromStorage();
  }

  /**
   * Load sessions from globalState
   */
  private loadFromStorage(): void {
    const stored = this.context.globalState.get<DialogSessionRecord[]>(
      STORAGE_KEY,
      []
    );
    this.sessions.clear();
    for (const record of stored) {
      this.sessions.set(record.sessionId, record);
    }
    console.log(
      `[DialogSessionsService] Loaded ${this.sessions.size} sessions from storage`
    );
  }

  /**
   * Save sessions to globalState
   */
  private async saveToStorage(): Promise<void> {
    // Sort by lastSeen descending and limit to MAX_HISTORY_SIZE
    const records = Array.from(this.sessions.values())
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, MAX_HISTORY_SIZE);

    // Update sessions map to reflect pruning
    this.sessions.clear();
    for (const record of records) {
      this.sessions.set(record.sessionId, record);
    }

    await this.context.globalState.update(STORAGE_KEY, records);
    console.log(
      `[DialogSessionsService] Saved ${records.length} sessions to storage`
    );
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  getSessionHistory(): DialogSessionRecord[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.lastSeen - a.lastSeen
    );
  }

  recordSession(record: DialogSessionRecord): void {
    const existing = this.sessions.get(record.sessionId);

    if (existing) {
      // Update existing record
      this.sessions.set(record.sessionId, {
        ...existing,
        lastSeen: record.lastSeen,
        requestsCount: record.requestsCount,
        status: record.status,
        // Keep original firstSeen and firstRequestPreview
        firstSeen: existing.firstSeen,
        firstRequestPreview:
          existing.firstRequestPreview || record.firstRequestPreview,
      });
    } else {
      // Add new record
      this.sessions.set(record.sessionId, record);
    }

    // Update current session
    this.currentSessionId = record.sessionId;

    // Save asynchronously
    this.saveToStorage();
  }

  clearHistory(): void {
    this.sessions.clear();
    this.currentSessionId = null;
    this.context.globalState.update(STORAGE_KEY, []);
    console.log("[DialogSessionsService] History cleared");
  }

  getSession(sessionId: string): DialogSessionRecord | undefined {
    return this.sessions.get(sessionId);
  }
}
