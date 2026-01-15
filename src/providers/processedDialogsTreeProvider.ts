// providers/processedDialogsTreeProvider.ts
import * as vscode from "vscode";
import CopilotChatAnalyzer, {
  DialogStatus,
  DialogStatusType,
  type UserRequest,
} from "copilot-chat-analyzer";
import { DialogSessionRecord } from "../services/dialogSessionsTypes";
import { DialogSessionsServiceImpl } from "../services/dialogSessionsService";

export class ProcessedDialogItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly record?: DialogSessionRecord,
    public readonly command?: vscode.Command,
    public readonly contextValue?: string,
    public readonly iconPath?: string | vscode.ThemeIcon,
    public readonly tooltip?: string,
    public readonly itemId?: string,
    public readonly description?: string
  ) {
    super(label, collapsibleState);
    this.command = command;
    this.contextValue = contextValue;
    this.iconPath = iconPath;
    this.tooltip = tooltip;
    this.id = itemId;
    this.description = description;
  }
}

export class ProcessedDialogsTreeProvider
  implements vscode.TreeDataProvider<ProcessedDialogItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ProcessedDialogItem | undefined | null | void
  > = new vscode.EventEmitter<ProcessedDialogItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    ProcessedDialogItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private sessionsService: DialogSessionsServiceImpl | undefined;
  private chatAnalyzer: CopilotChatAnalyzer;
  private requestsCache: Map<string, UserRequest[]> = new Map();

  constructor() {
    this.chatAnalyzer = new CopilotChatAnalyzer();
  }

  setSessionsService(service: DialogSessionsServiceImpl): void {
    this.sessionsService = service;
  }

  refresh(): void {
    this.requestsCache.clear();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ProcessedDialogItem): vscode.TreeItem {
    return element;
  }

  async getChildren(
    element?: ProcessedDialogItem
  ): Promise<ProcessedDialogItem[]> {
    // If element is a dialog item, return all user requests as children
    if (element && element.record) {
      return this.getRequestsForDialog(element.record);
    }

    if (!this.sessionsService) {
      return [
        new ProcessedDialogItem(
          "No session service available",
          vscode.TreeItemCollapsibleState.None,
          undefined,
          undefined,
          "noService",
          new vscode.ThemeIcon("warning")
        ),
      ];
    }

    const sessions = this.sessionsService.getSessionHistory();

    if (sessions.length === 0) {
      return [
        new ProcessedDialogItem(
          "No processed dialogs yet",
          vscode.TreeItemCollapsibleState.None,
          undefined,
          undefined,
          "empty",
          new vscode.ThemeIcon("info")
        ),
      ];
    }

    return sessions.map((session) => this.createSessionItem(session));
  }

  private async getRequestsForDialog(
    record: DialogSessionRecord
  ): Promise<ProcessedDialogItem[]> {
    const sessionId = record.sessionId;

    // Check cache first
    if (this.requestsCache.has(sessionId)) {
      const cachedRequests = this.requestsCache.get(sessionId)!;
      return this.createRequestItems(cachedRequests, sessionId);
    }

    // Load from file if chatJsonPath exists
    if (!record.chatJsonPath) {
      return [
        new ProcessedDialogItem(
          "No chat data available",
          vscode.TreeItemCollapsibleState.None,
          undefined,
          undefined,
          "noData",
          new vscode.ThemeIcon("warning"),
          "Chat JSON file not found"
        ),
      ];
    }

    try {
      const fileUri = vscode.Uri.file(record.chatJsonPath);
      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      const jsonContent = Buffer.from(fileContent).toString("utf8");
      const chatData = JSON.parse(jsonContent);

      const requests = this.chatAnalyzer.getUserRequests(chatData);
      this.requestsCache.set(sessionId, requests);

      return this.createRequestItems(requests, sessionId);
    } catch (error) {
      console.error(`Failed to load requests for session ${sessionId}:`, error);
      return [
        new ProcessedDialogItem(
          "Unable to load requests",
          vscode.TreeItemCollapsibleState.None,
          undefined,
          undefined,
          "error",
          new vscode.ThemeIcon("error"),
          error instanceof Error ? error.message : "Unknown error"
        ),
      ];
    }
  }

  private createRequestItems(
    requests: UserRequest[],
    sessionId: string
  ): ProcessedDialogItem[] {
    if (requests.length === 0) {
      return [
        new ProcessedDialogItem(
          "No user requests",
          vscode.TreeItemCollapsibleState.None,
          undefined,
          undefined,
          "empty",
          new vscode.ThemeIcon("info")
        ),
      ];
    }

    return requests.map((request, index) => {
      const truncatedMessage =
        request.message.length > 50
          ? request.message.substring(0, 50) + "..."
          : request.message;

      return new ProcessedDialogItem(
        `#${index + 1}: "${truncatedMessage}"`,
        vscode.TreeItemCollapsibleState.None,
        undefined,
        undefined,
        "dialogRequestItem",
        new vscode.ThemeIcon("comment"),
        request.message, // Full message in tooltip
        `${sessionId}-request-${index}`
      );
    });
  }

  private createSessionItem(session: DialogSessionRecord): ProcessedDialogItem {
    const shortId = session.sessionId.substring(0, 8) + "...";
    const preview = session.firstRequestPreview
      ? `"${session.firstRequestPreview.substring(0, 30)}${
          session.firstRequestPreview.length > 30 ? "..." : ""
        }"`
      : "No preview";

    const statusEmoji = this.getStatusEmoji(session.status);
    const statusText = this.getStatusText(session.status);
    const label = `${statusEmoji} ${statusText}`;
    const description = `${shortId} · ${session.requestsCount} req`;

    const lastSeenDate = new Date(session.lastSeen);
    const tooltip = [
      `Session: ${session.sessionId}`,
      `Status: ${session.status}`,
      `Requests: ${session.requestsCount}`,
      `Preview: ${session.firstRequestPreview || "N/A"}`,
      `Last seen: ${lastSeenDate.toLocaleString()}`,
      session.agentId ? `Agent: ${session.agentId}` : "",
      session.modelId ? `Model: ${session.modelId}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return new ProcessedDialogItem(
      label,
      session.firstRequestPreview
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
      session,
      undefined,
      "processedDialog",
      this.getStatusIcon(session.status),
      tooltip,
      session.sessionId,
      description
    );
  }

  private getStatusEmoji(status: DialogStatusType): string {
    switch (status) {
      case DialogStatus.COMPLETED:
        return "✅";
      case DialogStatus.CANCELED:
        return "❌";
      case DialogStatus.IN_PROGRESS:
        return "🔄";
      case DialogStatus.FAILED:
        return "⚠️";
      case DialogStatus.PENDING:
      default:
        return "⏳";
    }
  }

  private getStatusText(status: DialogStatusType): string {
    switch (status) {
      case DialogStatus.COMPLETED:
        return "completed";
      case DialogStatus.CANCELED:
        return "canceled";
      case DialogStatus.IN_PROGRESS:
        return "in progress";
      case DialogStatus.FAILED:
        return "failed";
      case DialogStatus.PENDING:
      default:
        return "pending";
    }
  }

  private getStatusIcon(status: DialogStatusType): vscode.ThemeIcon {
    const colorMap: Record<string, string> = {
      completed: "charts.green",
      canceled: "charts.red",
      in_progress: "charts.blue",
      failed: "charts.orange",
      pending: "charts.yellow",
    };

    const iconMap: Record<string, string> = {
      completed: "check",
      canceled: "x",
      in_progress: "sync",
      failed: "warning",
      pending: "clock",
    };

    const color = colorMap[status] || colorMap.pending;
    const iconName = iconMap[status] || iconMap.pending;

    return new vscode.ThemeIcon(
      iconName,
      color ? new vscode.ThemeColor(color) : undefined
    );
  }

  clearHistory(): void {
    if (this.sessionsService) {
      this.sessionsService.clearHistory();
      this.refresh();
    }
  }
}
