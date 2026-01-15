// providers/requestsTreeProvider.ts
import * as vscode from "vscode";
import {
  ChatMonitorData,
  ChatMonitorSubscriber,
} from "../services/chatMonitorTypes";

export interface ChatRequest {
  id: string;
  message: string;
  timestamp?: number;
  index: number;
}

export class RequestTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly request?: ChatRequest,
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

export class RequestsTreeProvider
  implements vscode.TreeDataProvider<RequestTreeItem>, ChatMonitorSubscriber
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    RequestTreeItem | undefined | null | void
  > = new vscode.EventEmitter<RequestTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    RequestTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private requests: ChatRequest[] = [];
  private chatContent: string = "";

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  // ChatMonitorSubscriber implementation
  onChatStatusUpdate(data: ChatMonitorData): void {
    // Requests are updated via updateRequests method
  }

  onChatCompleted?(): void {}
  onChatError?(error: string): void {}

  updateRequests(requests: ChatRequest[]): void {
    this.requests = requests;
    this.refresh();
  }

  updateFromChatData(chatData: any): void {
    this.requests = this.parseRequests(chatData);
    this.refresh();
  }

  private parseRequests(chatData: any): ChatRequest[] {
    const requests: ChatRequest[] = [];

    if (!chatData || !chatData.requests || !Array.isArray(chatData.requests)) {
      return requests;
    }

    chatData.requests.forEach((request: any, index: number) => {
      if (request.message && typeof request.message === "string") {
        requests.push({
          id: request.variableData?.requestId || `req-${index}`,
          message: request.message,
          timestamp: request.timestamp,
          index: index,
        });
      }
    });

    return requests;
  }

  getTreeItem(element: RequestTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: RequestTreeItem): Promise<RequestTreeItem[]> {
    if (element) {
      return [];
    }

    if (this.requests.length === 0) {
      return [
        new RequestTreeItem(
          "No requests yet",
          vscode.TreeItemCollapsibleState.None,
          undefined,
          "emptyState",
          new vscode.ThemeIcon("info"),
          "Start a chat with Copilot to see requests here"
        ),
      ];
    }

    return this.requests.map((request) => {
      const truncatedMessage = this.truncateMessage(request.message, 80);
      const fullMessage = request.message;

      return new RequestTreeItem(
        truncatedMessage,
        vscode.TreeItemCollapsibleState.None,
        request,
        "userRequest",
        new vscode.ThemeIcon("comment"),
        fullMessage,
        `request-${request.id}`,
        `#${request.index + 1}`
      );
    });
  }

  private truncateMessage(message: string, maxLength: number): string {
    const cleanMessage = message.replace(/\s+/g, " ").trim();
    if (cleanMessage.length <= maxLength) {
      return cleanMessage;
    }
    return cleanMessage.substring(0, maxLength - 3) + "...";
  }

  getRequestsCount(): number {
    return this.requests.length;
  }
}
