// mcp/GetRequestTool.ts - MCP tool to retrieve specific request by index
import * as vscode from "vscode";
import { Tool } from "./Tool";
import CopilotChatAnalyzer from "copilot-chat-analyzer";
import type { ChatMonitorTreeProvider } from "../providers/chatMonitorTreeProvider";
import type { DialogSessionsServiceImpl } from "../services/dialogSessionsService";

interface GetRequestToolOptions {
  index: number;
  sessionId?: string;
}

/**
 * MCP tool that retrieves a specific user request by position from a dialog
 */
export class GetRequestTool extends Tool {
  public readonly toolName = "chat_secretary_get_request";
  private chatAnalyzer: CopilotChatAnalyzer;

  public readonly description = `Retrieves a specific user request by position from a Copilot Chat dialog.

**Use this tool when:**
- You need to recall a specific request from the dialog history
- User asks about their Nth question or request
- You need to reference a particular point in the conversation

**Parameters:**
- index (required): Position of the request (1-based, where 1 is the first request)
- sessionId (optional): Specific dialog session ID. If not provided, uses current active dialog.

**Returns:**
JSON with:
- success: boolean
- sessionId: string (if found)
- request: string (full request message)
- index: number (the requested position)
- timestamp: number (Unix ms)
- totalRequests: number (total requests in dialog)
- error: string (if failed)

**Example usage scenarios:**
1. Get 2nd request from current dialog:
   Call with { index: 2 }
   
2. Get 3rd request from specific dialog:
   Call with { index: 3, sessionId: "abc-123-def-456" }`;

  public readonly inputSchema = {
    type: "object",
    properties: {
      index: {
        type: "number",
        description:
          "Required: Position of the request (1-based). 1 = first request, 2 = second, etc.",
      },
      sessionId: {
        type: "string",
        description:
          "Optional: Dialog session ID. If omitted, uses current active dialog.",
      },
    },
    required: ["index"],
  };

  constructor(
    private chatMonitorProvider: ChatMonitorTreeProvider,
    private sessionsService: DialogSessionsServiceImpl,
    private context: vscode.ExtensionContext
  ) {
    super();
    this.chatAnalyzer = new CopilotChatAnalyzer();
  }

  async call(
    options: vscode.LanguageModelToolInvocationOptions<GetRequestToolOptions>,
    _token: vscode.CancellationToken
  ): Promise<string> {
    try {
      const { index, sessionId } = options.input || {};

      // Validate index parameter is provided
      if (index === undefined || index === null) {
        return this.formatError("Index parameter is required");
      }

      // Validate index >= 1
      if (index < 1) {
        return this.formatError("Index must be 1 or greater");
      }

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

      // Check if chat JSON file is available
      if (!session.chatJsonPath) {
        return this.formatError("Chat data not available for session");
      }

      // Load and parse chat JSON file
      const fileUri = vscode.Uri.file(session.chatJsonPath);
      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      const jsonContent = Buffer.from(fileContent).toString("utf8");
      const chatData = JSON.parse(jsonContent);

      // Get requests using analyzer
      const requests = this.chatAnalyzer.getUserRequests(chatData);

      // Validate index <= totalRequests
      if (index > requests.length) {
        return this.formatError(
          `Index ${index} exceeds total requests (${requests.length})`
        );
      }

      // Get request at index (convert to 0-based)
      const request = requests[index - 1];

      // Return successful response
      return this.formatSuccess({
        sessionId: session.sessionId,
        request: request.message,
        index: index,
        timestamp: request.timestamp || session.firstSeen,
        totalRequests: requests.length,
      });
    } catch (error) {
      if (error instanceof Error) {
        return this.formatError(`Failed to retrieve request: ${error.message}`);
      }
      return this.formatError("Service temporarily unavailable");
    }
  }
}
