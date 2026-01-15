// providers/openedDialogTreeProvider.ts
import * as vscode from "vscode";
import CopilotChatAnalyzer, {
  type UserRequest,
  type ConversationTurn,
  type AIResponse,
  DialogStatus,
  type DialogStatusType,
} from "copilot-chat-analyzer";
import {
  ChatMonitorData,
  ChatMonitorSubscriber,
} from "../services/chatMonitorTypes";

export { UserRequest, ConversationTurn, AIResponse };

/**
 * Response status for visual indicators
 */
export enum ResponseStatus {
  SUCCESS = "success",
  ERROR = "error",
  IN_PROGRESS = "in_progress",
  PENDING = "pending",
}

export class OpenedDialogItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly turn?: ConversationTurn,
    public readonly response?: AIResponse | null,
    public readonly contextValue?: string,
    public readonly iconPath?: string | vscode.ThemeIcon,
    public readonly tooltip?: string,
    public readonly itemId?: string,
    public readonly itemDescription?: string
  ) {
    super(label, collapsibleState);
    this.contextValue = contextValue;
    this.iconPath = iconPath;
    this.tooltip = tooltip;
    this.id = itemId;
    this.description = itemDescription;
  }
}

export class OpenedDialogTreeProvider
  implements vscode.TreeDataProvider<OpenedDialogItem>, ChatMonitorSubscriber
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    OpenedDialogItem | undefined | null | void
  > = new vscode.EventEmitter<OpenedDialogItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    OpenedDialogItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private conversation: ConversationTurn[] = [];
  private dialogStatus: DialogStatusType = DialogStatus.PENDING;
  private chatAnalyzer: CopilotChatAnalyzer;

  constructor() {
    this.chatAnalyzer = new CopilotChatAnalyzer();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  // ChatMonitorSubscriber implementation
  onChatStatusUpdate(data: ChatMonitorData): void {
    // Status updates handled via updateFromChatData
  }

  onChatCompleted?(): void {}
  onChatError?(error: string): void {}

  updateFromChatData(chatData: any): void {
    this.conversation = this.chatAnalyzer.getConversationHistory(chatData);
    this.dialogStatus = this.chatAnalyzer.getDialogStatus(chatData);
    this.refresh();
  }

  getTreeItem(element: OpenedDialogItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: OpenedDialogItem): Promise<OpenedDialogItem[]> {
    // If element is a conversation turn, return its response
    if (
      element &&
      element.contextValue === "conversationTurn" &&
      element.turn
    ) {
      return this.getResponseForTurn(element.turn);
    }

    // Root level - return conversation turns
    if (this.conversation.length === 0) {
      return [
        new OpenedDialogItem(
          "No active dialog",
          vscode.TreeItemCollapsibleState.None,
          undefined,
          undefined,
          "emptyState",
          new vscode.ThemeIcon("info"),
          "Start a chat with Copilot to see the conversation here"
        ),
      ];
    }

    return this.conversation.map((turn) => this.createTurnItem(turn));
  }

  private createTurnItem(turn: ConversationTurn): OpenedDialogItem {
    const truncatedMessage = this.truncateMessage(turn.request.message, 60);
    const status = this.getResponseStatus(turn);
    const statusIcon = this.getStatusIcon(status);

    return new OpenedDialogItem(
      `#${turn.index + 1} "${truncatedMessage}"`,
      vscode.TreeItemCollapsibleState.Collapsed,
      turn,
      turn.response,
      "conversationTurn",
      new vscode.ThemeIcon("comment"),
      turn.request.message, // Full message in tooltip
      `turn-${turn.index}`,
      statusIcon // Status as description
    );
  }

  private getResponseForTurn(turn: ConversationTurn): OpenedDialogItem[] {
    const status = this.getResponseStatus(turn);
    const response = turn.response;

    if (!response) {
      // No response yet
      const icon = this.getStatusThemeIcon(status);
      return [
        new OpenedDialogItem(
          "🤖 (waiting for response...)",
          vscode.TreeItemCollapsibleState.None,
          undefined,
          null,
          "aiResponse",
          icon,
          "Response is being generated",
          `response-${turn.index}`
        ),
      ];
    }

    const truncatedResponse = this.truncateMessage(
      response.message || "(empty response)",
      50
    );
    const toolInfo =
      response.toolCallCount > 0 ? ` [${response.toolCallCount} tools]` : "";
    const icon = this.getStatusThemeIcon(status);

    return [
      new OpenedDialogItem(
        `🤖 "${truncatedResponse}"${toolInfo}`,
        vscode.TreeItemCollapsibleState.None,
        undefined,
        response,
        "aiResponse",
        icon,
        response.message || "Empty response", // Full response in tooltip
        `response-${turn.index}`
      ),
    ];
  }

  private getResponseStatus(turn: ConversationTurn): ResponseStatus {
    const isLastTurn = turn.index === this.conversation.length - 1;

    // No response object
    if (!turn.response) {
      if (isLastTurn && this.dialogStatus === DialogStatus.IN_PROGRESS) {
        return ResponseStatus.IN_PROGRESS;
      }
      return ResponseStatus.PENDING;
    }

    // Check for canceled dialog
    if (this.dialogStatus === DialogStatus.CANCELED && isLastTurn) {
      return ResponseStatus.ERROR;
    }

    // Check for failed dialog
    if (this.dialogStatus === DialogStatus.FAILED && isLastTurn) {
      return ResponseStatus.ERROR;
    }

    // Response exists with content
    if (turn.response.message) {
      return ResponseStatus.SUCCESS;
    }

    // Empty response might indicate error
    return ResponseStatus.PENDING;
  }

  private getStatusIcon(status: ResponseStatus): string {
    switch (status) {
      case ResponseStatus.SUCCESS:
        return "✅";
      case ResponseStatus.ERROR:
        return "❌";
      case ResponseStatus.IN_PROGRESS:
        return "⏳";
      case ResponseStatus.PENDING:
      default:
        return "⏳";
    }
  }

  private getStatusThemeIcon(status: ResponseStatus): vscode.ThemeIcon {
    switch (status) {
      case ResponseStatus.SUCCESS:
        return new vscode.ThemeIcon(
          "check",
          new vscode.ThemeColor("charts.green")
        );
      case ResponseStatus.ERROR:
        return new vscode.ThemeIcon(
          "error",
          new vscode.ThemeColor("charts.red")
        );
      case ResponseStatus.IN_PROGRESS:
        return new vscode.ThemeIcon(
          "sync~spin",
          new vscode.ThemeColor("charts.blue")
        );
      case ResponseStatus.PENDING:
      default:
        return new vscode.ThemeIcon(
          "clock",
          new vscode.ThemeColor("charts.yellow")
        );
    }
  }

  private truncateMessage(message: string, maxLength: number): string {
    const cleanMessage = message.replace(/\s+/g, " ").trim();
    if (cleanMessage.length <= maxLength) {
      return cleanMessage;
    }
    return cleanMessage.substring(0, maxLength - 3) + "...";
  }

  getConversationCount(): number {
    return this.conversation.length;
  }
}
