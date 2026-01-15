// api/commandsApi.ts - External Commands API for Copilot Chat Secretary
import * as vscode from "vscode";
import type { ChatMonitorTreeProvider } from "../providers/chatMonitorTreeProvider";
import type { DialogSessionsServiceImpl } from "../services/dialogSessionsService";
import type { DialogSessionRecord } from "../services/dialogSessionsTypes";
import type {
  ChatStatusResponse,
  DialogSessionResponse,
  GetDialogHistoryOptions,
  GetSessionOptions,
} from "./types";
import { API_COMMANDS } from "../utils/constants";

/**
 * Converts internal DialogSessionRecord to public DialogSessionResponse
 * Returns a copy to prevent external mutation
 */
function toDialogSessionResponse(
  record: DialogSessionRecord
): DialogSessionResponse {
  return {
    sessionId: record.sessionId,
    status: record.status,
    firstSeen: record.firstSeen,
    lastSeen: record.lastSeen,
    requestsCount: record.requestsCount,
    firstRequestPreview: record.firstRequestPreview,
    agentId: record.agentId,
    modelId: record.modelId,
  };
}

/**
 * Registers all external API commands
 * @param chatMonitorProvider - The chat monitor tree provider instance
 * @param sessionsService - The dialog sessions service instance
 * @returns Array of disposables for cleanup
 */
export function registerApiCommands(
  chatMonitorProvider: ChatMonitorTreeProvider,
  sessionsService: DialogSessionsServiceImpl
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // copilotChatSecretary.api.getStatus
  disposables.push(
    vscode.commands.registerCommand(
      API_COMMANDS.GET_STATUS,
      (): ChatStatusResponse => {
        return {
          status:
            chatMonitorProvider.getStatusString() as ChatStatusResponse["status"],
          sessionId: chatMonitorProvider.getCurrentSessionId(),
          requestsCount: chatMonitorProvider.getRequestsCount(),
          lastUpdate: Date.now(),
        };
      }
    )
  );

  // copilotChatSecretary.api.getCurrentDialog
  disposables.push(
    vscode.commands.registerCommand(
      API_COMMANDS.GET_CURRENT_DIALOG,
      (): DialogSessionResponse | null => {
        const sessionId = chatMonitorProvider.getCurrentSessionId();
        if (!sessionId) {
          return null;
        }
        const session = sessionsService.getSession(sessionId);
        if (!session) {
          return null;
        }
        return toDialogSessionResponse(session);
      }
    )
  );

  // copilotChatSecretary.api.getDialogHistory
  disposables.push(
    vscode.commands.registerCommand(
      API_COMMANDS.GET_DIALOG_HISTORY,
      (options?: GetDialogHistoryOptions): DialogSessionResponse[] => {
        const limit = options?.limit ?? 100;
        const statusFilter = options?.status;

        let sessions = sessionsService.getSessionHistory();

        // Filter by status if specified
        if (statusFilter) {
          sessions = sessions.filter((s) => s.status === statusFilter);
        }

        // Limit results
        sessions = sessions.slice(0, limit);

        // Return copies
        return sessions.map(toDialogSessionResponse);
      }
    )
  );

  // copilotChatSecretary.api.getSession
  disposables.push(
    vscode.commands.registerCommand(
      API_COMMANDS.GET_SESSION,
      (options?: GetSessionOptions): DialogSessionResponse | null => {
        if (!options?.sessionId) {
          return null;
        }
        const session = sessionsService.getSession(options.sessionId);
        if (!session) {
          return null;
        }
        return toDialogSessionResponse(session);
      }
    )
  );

  console.log("[CommandsAPI] Registered external API commands");
  return disposables;
}
