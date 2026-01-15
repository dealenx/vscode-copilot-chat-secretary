// providers/chatMonitorTreeProvider.ts
import * as vscode from "vscode";
import CopilotChatAnalyzer from "copilot-chat-analyzer";
import {
  ChatMonitorData,
  ChatMonitorSubscriber,
  ChatMonitorService,
} from "../services/chatMonitorTypes";

export class ChatMonitorTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
    public readonly contextValue?: string,
    public readonly iconPath?: string | vscode.ThemeIcon,
    public readonly tooltip?: string
  ) {
    super(label, collapsibleState);
    this.command = command;
    this.contextValue = contextValue;
    this.iconPath = iconPath;
    this.tooltip = tooltip;
  }
}

interface ChatStatus {
  status: string;
  lastUpdate: Date;
  content: string;
  hasActivity: boolean;
  requestsCount: number;
  lastRequestId?: string;
  statusDetails?: any;
}

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

  constructor(private context: vscode.ExtensionContext) {
    this.chatAnalyzer = new CopilotChatAnalyzer();
    this.chatStatus = {
      status: "unknown",
      lastUpdate: new Date(),
      content: "",
      hasActivity: false,
      requestsCount: 0,
    };

    // Start monitoring automatically on creation
    this.startAutomaticMonitoring();
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
      case "unknown":
      default:
        return "❓";
    }
  }

  private getChatStatusIcon(status: string): vscode.ThemeIcon {
    const colorMap = {
      completed: "charts.green",
      canceled: "charts.red",
      in_progress: "charts.blue",
      unknown: "charts.gray",
    };

    const iconMap = {
      completed: "check",
      canceled: "x",
      in_progress: "sync",
      unknown: "question",
    };

    const color = colorMap[status as keyof typeof colorMap];
    const iconName = iconMap[status as keyof typeof iconMap];

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
    if (!element) {
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

      // Requests count
      const requestsLabel = `📊 Requests: ${this.chatStatus.requestsCount}`;
      items.push(
        new ChatMonitorTreeItem(
          requestsLabel,
          vscode.TreeItemCollapsibleState.None,
          undefined,
          "requestsCount",
          new vscode.ThemeIcon("graph"),
          `Total requests in chat: ${this.chatStatus.requestsCount}`
        )
      );

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

    return [];
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
        // If export fails, try alternative method
        this.chatStatus.status = "unknown";
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
          // If JSON parse fails, format is incorrect
          this.chatStatus.status = "unknown";
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
        this.chatStatus.status = "unknown";
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
      // On error, mark status as unknown
      this.chatStatus.status = "unknown";
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
      status: this.chatStatus.status as
        | "completed"
        | "canceled"
        | "in_progress"
        | "unknown",
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
