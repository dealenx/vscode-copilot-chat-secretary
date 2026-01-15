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
    // Sort by lastSeen descending
    const allRecords = Array.from(this.sessions.values()).sort(
      (a, b) => b.lastSeen - a.lastSeen
    );

    // Keep only MAX_HISTORY_SIZE records
    const recordsToKeep = allRecords.slice(0, MAX_HISTORY_SIZE);
    const recordsToRemove = allRecords.slice(MAX_HISTORY_SIZE);

    // Clean up JSON files for removed sessions
    for (const record of recordsToRemove) {
      if (record.chatJsonPath) {
        try {
          const fileUri = vscode.Uri.file(record.chatJsonPath);
          await vscode.workspace.fs.delete(fileUri);
          console.log(
            `[DialogSessionsService] Cleaned up old JSON: ${record.chatJsonPath}`
          );
        } catch (error) {
          // File may not exist, which is fine
        }
      }
    }

    // Update sessions map to reflect pruning
    this.sessions.clear();
    for (const record of recordsToKeep) {
      this.sessions.set(record.sessionId, record);
    }

    await this.context.globalState.update(STORAGE_KEY, recordsToKeep);
    console.log(
      `[DialogSessionsService] Saved ${recordsToKeep.length} sessions to storage`
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
        // Update chatJsonPath if new one provided
        chatJsonPath: record.chatJsonPath || existing.chatJsonPath,
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
