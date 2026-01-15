// providers/chatMonitorTreeProvider.ts
import * as vscode from "vscode";
import CopilotChatAnalyzer, {
  type UserRequest,
  type DialogStatusType,
  DialogStatus,
} from "copilot-chat-analyzer";
import {
  ChatMonitorData,
  ChatMonitorSubscriber,
  ChatMonitorService,
} from "../services/chatMonitorTypes";
import { DialogSessionsServiceImpl } from "../services/dialogSessionsService";
import { DialogSessionRecord } from "../services/dialogSessionsTypes";

export class ChatMonitorTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
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

interface ChatStatus {
  status: DialogStatusType;
  lastUpdate: Date;
  content: string;
  hasActivity: boolean;
  requestsCount: number;
  lastRequestId?: string;
  statusDetails?: any;
  requests: UserRequest[];
  sessionId?: string;
}

import { RequestsTreeProvider } from "./requestsTreeProvider";

export class ChatMonitorTreeProvider
  implements vscode.TreeDataProvider<ChatMonitorTreeItem>, ChatMonitorService
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ChatMonitorTreeItem | undefined | null | void
  > = new vscode.EventEmitter<ChatMonitorTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    ChatMonitorTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private chatStatus: ChatStatus;
  private refreshTimer: NodeJS.Timeout | undefined;
  private isMonitoringActive: boolean = false;
  private chatAnalyzer: CopilotChatAnalyzer;
  private subscribers: Set<ChatMonitorSubscriber> = new Set();
  private requestsProvider: RequestsTreeProvider | undefined;
  private sessionsService: DialogSessionsServiceImpl;
  private onSessionRecorded: (() => void) | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.chatAnalyzer = new CopilotChatAnalyzer();
    this.sessionsService = new DialogSessionsServiceImpl(context);
    this.chatStatus = {
      status: DialogStatus.PENDING,
      lastUpdate: new Date(),
      content: "",
      hasActivity: false,
      requestsCount: 0,
      requests: [],
    };

    // Start monitoring automatically on creation
    this.startAutomaticMonitoring();
  }

  setRequestsProvider(provider: RequestsTreeProvider): void {
    this.requestsProvider = provider;
  }

  setOnSessionRecorded(callback: () => void): void {
    this.onSessionRecorded = callback;
  }

  getSessionsService(): DialogSessionsServiceImpl {
    return this.sessionsService;
  }

  getCurrentSessionId(): string | null {
    return this.chatStatus.sessionId || null;
  }

  getStatusString(): string {
    return this.chatStatus.status;
  }

  getRequestsCount(): number {
    return this.chatStatus.requestsCount;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  private startAutomaticMonitoring(): void {
    this.isMonitoringActive = true;
    this.refreshTimer = setInterval(() => {
      this.checkChatStatus();
    }, 1000); // Check every second for real-time updates

    // Check status immediately
    this.checkChatStatus();
  }
  private getChatStatusEmoji(status: string): string {
    switch (status) {
      case "completed":
        return "✅";
      case "canceled":
        return "❌";
      case "in_progress":
        return "🔄";
      case "failed":
        return "⚠️";
      case "pending":
      default:
        return "⏳";
    }
  }

  private getChatStatusIcon(status: string): vscode.ThemeIcon {
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

  getTreeItem(element: ChatMonitorTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(
    element?: ChatMonitorTreeItem
  ): Promise<ChatMonitorTreeItem[]> {
    // This provider only has root level items
    if (element) {
      return [];
    }

    // Root level items
    const items: ChatMonitorTreeItem[] = [];

    // Monitoring status (always active)
    items.push(
      new ChatMonitorTreeItem(
        "🟢 Automatic Monitoring",
        vscode.TreeItemCollapsibleState.None,
        undefined,
        "monitoringStatus",
        new vscode.ThemeIcon("eye"),
        "Copilot chat monitoring is running automatically"
      )
    );

    // Current chat status
    const chatLabel = `${this.getChatStatusEmoji(
      this.chatStatus.status
    )} Status: ${this.chatStatus.status}`;
    items.push(
      new ChatMonitorTreeItem(
        chatLabel,
        vscode.TreeItemCollapsibleState.None,
        undefined,
        "chatStatus",
        this.getChatStatusIcon(this.chatStatus.status),
        `Last update: ${this.chatStatus.lastUpdate.toLocaleTimeString()}`
      )
    );

    // Requests count (simple counter, list is in separate view)
    items.push(
      new ChatMonitorTreeItem(
        `📊 Requests: ${this.chatStatus.requestsCount}`,
        vscode.TreeItemCollapsibleState.None,
        undefined,
        "requestsCount",
        new vscode.ThemeIcon("comment-discussion"),
        `Total user requests in chat: ${this.chatStatus.requestsCount}`
      )
    );

    // Session ID (if available)
    if (this.chatStatus.sessionId) {
      const shortSessionId = this.chatStatus.sessionId.substring(0, 8) + "...";
      items.push(
        new ChatMonitorTreeItem(
          `🆔 Session: ${shortSessionId}`,
          vscode.TreeItemCollapsibleState.None,
          undefined,
          "sessionId",
          new vscode.ThemeIcon("key"),
          `Full Session ID: ${this.chatStatus.sessionId}`
        )
      );
    }

    // Chat activity
    const activityLabel = this.chatStatus.hasActivity
      ? "🟢 Active"
      : "⚪ No Activity";
    items.push(
      new ChatMonitorTreeItem(
        activityLabel,
        vscode.TreeItemCollapsibleState.None,
        undefined,
        "chatActivity",
        new vscode.ThemeIcon(
          this.chatStatus.hasActivity ? "pulse" : "circle-outline"
        ),
        this.chatStatus.hasActivity
          ? "Chat activity detected"
          : "No chat activity"
      )
    );

    // Manual refresh button
    items.push(
      new ChatMonitorTreeItem(
        "🔄 Refresh Now",
        vscode.TreeItemCollapsibleState.None,
        {
          command: "copilotChatSecretary.refreshStatus",
          title: "Refresh Chat Status",
        },
        "refreshChatStatus",
        new vscode.ThemeIcon("refresh")
      )
    );

    return items;
  }

  private async checkChatStatus(): Promise<void> {
    try {
      // Создаем временный файл для экспорта чата в JSON формате
      const tempUri = vscode.Uri.joinPath(
        this.context.globalStorageUri,
        `chat-monitor-${Date.now()}.json`
      );

      // Экспортируем чат в JSON формате
      try {
        await vscode.commands.executeCommand(
          "workbench.action.chat.export",
          tempUri
        );
      } catch (exportError) {
        console.log(`Chat export error: ${exportError}`);
        // If export fails, keep pending status
        this.chatStatus.status = DialogStatus.PENDING;
        this.chatStatus.hasActivity = false;
        this.refresh();
        return;
      }

      // Читаем содержимое JSON файла
      const content = await vscode.workspace.fs.readFile(tempUri);
      const jsonContent = Buffer.from(content).toString("utf8");

      // Проверяем изменения
      const hasChanged = jsonContent !== this.chatStatus.content;

      if (hasChanged) {
        this.chatStatus.content = jsonContent;
        this.chatStatus.lastUpdate = new Date();
        this.chatStatus.hasActivity = true;
        console.log("Chat content changed, updating");
      } else {
        this.chatStatus.hasActivity = false;
      }

      // Всегда анализируем статус, даже если содержимое не изменилось
      try {
        // Парсим JSON данные чата
        let chatData;
        try {
          chatData = JSON.parse(jsonContent);
          console.log(
            `Chat data parsed successfully. Structure:`,
            Object.keys(chatData)
          );
          if (chatData.messages) {
            console.log(`Messages count in chat: ${chatData.messages.length}`);
          }
        } catch (parseError) {
          console.log(`JSON parse error: ${parseError}`);
          console.log(
            `JSON content preview: ${jsonContent.substring(0, 200)}...`
          );
          // If JSON parse fails, keep pending status
          this.chatStatus.status = DialogStatus.PENDING;
          this.chatStatus.requestsCount = 0;
          this.refresh();
          return;
        }

        // Логируем данные для отладки
        console.log(`Chat JSON length: ${jsonContent.length}`);
        console.log(`Chat data structure:`, Object.keys(chatData));

        // Анализируем чат с помощью библиотеки
        const status = this.chatAnalyzer.getDialogStatus(chatData);
        const requestsCount = this.chatAnalyzer.getRequestsCount(chatData);

        // Получаем детальную информацию
        const statusDetails =
          this.chatAnalyzer.getDialogStatusDetails(chatData);
        console.log(`Status details:`, statusDetails);

        // Проверяем, изменился ли статус
        const statusChanged = this.chatStatus.status !== status;

        this.chatStatus.status = status;
        this.chatStatus.requestsCount = requestsCount;
        this.chatStatus.statusDetails = statusDetails;
        this.chatStatus.lastRequestId = statusDetails.lastRequestId;

        // Debug: log first request structure to understand format
        if (chatData.requests && chatData.requests.length > 0) {
          console.log(`First request keys:`, Object.keys(chatData.requests[0]));
          console.log(
            `First request sample:`,
            JSON.stringify(chatData.requests[0]).substring(0, 500)
          );
        }

        // Parse and store user requests using library method
        this.chatStatus.requests = this.chatAnalyzer.getUserRequests(chatData);
        console.log(`Parsed user requests: ${this.chatStatus.requests.length}`);

        // Extract and record session information
        const sessionInfo = this.chatAnalyzer.getSessionInfo(chatData);
        if (sessionInfo?.sessionId) {
          this.chatStatus.sessionId = sessionInfo.sessionId;

          // Get first user message for preview
          const firstRequestPreview =
            this.chatStatus.requests.length > 0
              ? this.chatStatus.requests[0].message.substring(0, 80)
              : "";

          // Save chat JSON to file for later access
          let chatJsonPath: string | undefined;
          try {
            const chatExportsUri = vscode.Uri.joinPath(
              this.context.globalStorageUri,
              "chat-exports",
              `${sessionInfo.sessionId}.json`
            );
            await vscode.workspace.fs.writeFile(
              chatExportsUri,
              Buffer.from(jsonContent, "utf8")
            );
            chatJsonPath = chatExportsUri.fsPath;
            console.log(`Chat JSON saved to: ${chatJsonPath}`);
          } catch (saveError) {
            console.log(`Failed to save chat JSON: ${saveError}`);
          }

          // Record session to history
          const sessionRecord: DialogSessionRecord = {
            sessionId: sessionInfo.sessionId,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            requestsCount: requestsCount,
            status: status,
            firstRequestPreview: firstRequestPreview,
            agentId: sessionInfo.agentId,
            modelId: sessionInfo.modelId,
            chatJsonPath: chatJsonPath,
          };
          this.sessionsService.recordSession(sessionRecord);
          console.log(`Session recorded: ${sessionInfo.sessionId}`);

          // Notify about session recorded to refresh dialogs list
          if (this.onSessionRecorded) {
            this.onSessionRecorded();
          }
        }

        // Update requests provider - always update to ensure sync
        if (this.requestsProvider) {
          console.log(
            `Updating requests provider with ${this.chatStatus.requests.length} requests`
          );
          this.requestsProvider.updateRequests(this.chatStatus.requests);
        } else {
          console.log(`No requests provider set`);
        }

        if (statusChanged || hasChanged) {
          console.log(`=== COPILOT CHAT ANALYZER ===`);
          console.log(`Requests count: ${requestsCount}`);
          console.log(`Dialog status: ${status}`);
          console.log(`Status changed: ${statusChanged}`);
          console.log(`Content changed: ${hasChanged}`);
          console.log(`==============================`);

          // Уведомляем подписчиков об изменении статуса
          this.notifySubscribers();

          // Если чат завершен, уведомляем о завершении
          if (status === "completed" && statusChanged) {
            this.notifyCompletion();
          }
        }
      } catch (analyzerError) {
        const errorMessage = `Analyzer error: ${analyzerError}`;
        console.log(errorMessage);
        console.log(`Error details:`, analyzerError);
        this.chatStatus.status = DialogStatus.PENDING;
        this.chatStatus.requestsCount = 0;
        this.notifyError(errorMessage);
      }

      // Удаляем временный файл
      try {
        await vscode.workspace.fs.delete(tempUri);
      } catch (deleteError) {
        // Игнорируем ошибки удаления
      }

      // Всегда обновляем UI для отображения актуального статуса
      this.refresh();
    } catch (error) {
      const errorMessage = `Chat monitoring error: ${error}`;
      console.log(errorMessage);
      // On error, keep pending status
      this.chatStatus.status = DialogStatus.PENDING;
      this.chatStatus.hasActivity = false;
      this.notifyError(errorMessage);
      this.refresh();
    }
  }

  // ChatMonitorService interface methods
  public subscribe(subscriber: ChatMonitorSubscriber): void {
    this.subscribers.add(subscriber);
  }

  public unsubscribe(subscriber: ChatMonitorSubscriber): void {
    this.subscribers.delete(subscriber);
  }

  public getCurrentStatus(): ChatMonitorData {
    return {
      status: this.chatStatus.status,
      requestsCount: this.chatStatus.requestsCount,
      lastUpdate: this.chatStatus.lastUpdate,
      hasActivity: this.chatStatus.hasActivity,
      lastRequestId: this.chatStatus.lastRequestId,
      statusDetails: this.chatStatus.statusDetails,
    };
  }

  public async refreshStatus(): Promise<void> {
    await this.checkChatStatus();
  }

  public startMonitoring(): void {
    this.startAutomaticMonitoring();
  }

  public stopMonitoring(): void {
    this.dispose();
  }

  public isMonitoring(): boolean {
    return this.isMonitoringActive;
  }

  private notifySubscribers(): void {
    const data = this.getCurrentStatus();
    this.subscribers.forEach((subscriber) => {
      try {
        subscriber.onChatStatusUpdate(data);
      } catch (error) {
        console.error("Error notifying chat monitor subscriber:", error);
      }
    });
  }

  private notifyCompletion(): void {
    this.subscribers.forEach((subscriber) => {
      if (subscriber.onChatCompleted) {
        try {
          subscriber.onChatCompleted();
        } catch (error) {
          console.error("Error notifying chat completion:", error);
        }
      }
    });
  }

  private notifyError(error: string): void {
    this.subscribers.forEach((subscriber) => {
      if (subscriber.onChatError) {
        try {
          subscriber.onChatError(error);
        } catch (error) {
          console.error("Error notifying chat error:", error);
        }
      }
    });
  }

  public dispose(): void {
    this.isMonitoringActive = false;
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    this.subscribers.clear();
  }
}
