// mcp/GetFirstRequestTool.ts - MCP tool to retrieve first request from dialog
import * as vscode from "vscode";
import { Tool } from "./Tool";
import type { ChatMonitorTreeProvider } from "../providers/chatMonitorTreeProvider";
import type { DialogSessionsServiceImpl } from "../services/dialogSessionsService";

interface GetFirstRequestToolOptions {
  sessionId?: string;
}

/**
 * MCP tool that retrieves the first user request from a Copilot Chat dialog
 */
export class GetFirstRequestTool extends Tool {
  public readonly toolName = "chat_secretary_get_first_request";

  public readonly description = `Retrieves the first user request from a Copilot Chat dialog.

**Use this tool when:**
- You need to recall the original user request after context compression
- User asks "what was my original question?" or similar
- You need to understand the initial context of the conversation

**Parameters:**
- sessionId (optional): Specific dialog session ID. If not provided, returns from current active dialog.

**Returns:**
JSON with:
- success: boolean
- sessionId: string (if found)
- firstRequest: string (first 80 chars of the initial message)
- timestamp: number (Unix ms)
- requestsCount: number
- error: string (if failed)

**Example usage scenarios:**
1. Get first request from current dialog:
   Call without parameters
   
2. Get first request from specific dialog:
   Call with { sessionId: "abc-123-def-456" }`;

  public readonly inputSchema = {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description:
          "Optional: Dialog session ID. If omitted, uses current active dialog.",
      },
    },
  };

  constructor(
    private chatMonitorProvider: ChatMonitorTreeProvider,
    private sessionsService: DialogSessionsServiceImpl
  ) {
    super();
  }

  async call(
    options: vscode.LanguageModelToolInvocationOptions<GetFirstRequestToolOptions>,
    _token: vscode.CancellationToken
  ): Promise<string> {
    try {
      const { sessionId } = options.input || {};

      // Determine which session to use
      let targetSessionId: string;
      if (sessionId) {
        targetSessionId = sessionId;
      } else {
        const currentSession = this.chatMonitorProvider.getCurrentSessionId();
        if (!currentSession) {
          return this.formatError("No active dialog found");
        }
        targetSessionId = currentSession;
      }

      // Retrieve session from service
      const session = this.sessionsService.getSession(targetSessionId);
      if (!session) {
        return this.formatError(`Session not found: ${targetSessionId}`);
      }

      // Check if first request is available
      if (!session.firstRequestPreview) {
        return this.formatError("First request not available");
      }

      // Return successful response
      return this.formatSuccess({
        sessionId: session.sessionId,
        firstRequest: session.firstRequestPreview,
        timestamp: session.firstSeen,
        requestsCount: session.requestsCount,
      });
    } catch (error) {
      return this.formatError("Service temporarily unavailable");
    }
  }
}
