// providers/processedDialogsTreeProvider.ts
import * as vscode from "vscode";
import { DialogStatus, DialogStatusType } from "copilot-chat-analyzer";
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

  constructor() {}

  setSessionsService(service: DialogSessionsServiceImpl): void {
    this.sessionsService = service;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ProcessedDialogItem): vscode.TreeItem {
    return element;
  }

  async getChildren(
    element?: ProcessedDialogItem
  ): Promise<ProcessedDialogItem[]> {
    if (element) {
      return [];
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
      vscode.TreeItemCollapsibleState.None,
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
