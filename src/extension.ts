// extension.ts - Copilot Chat Secretary
import * as vscode from "vscode";
import { ChatMonitorTreeProvider } from "./providers/chatMonitorTreeProvider";
import { OpenedDialogTreeProvider } from "./providers/openedDialogTreeProvider";
import { ProcessedDialogsTreeProvider } from "./providers/processedDialogsTreeProvider";
import { logger, LogCategory } from "./utils/logger";
import { COMMANDS } from "./utils/constants";
import { registerApiCommands } from "./api/commandsApi";
import { GetFirstRequestTool } from "./mcp/GetFirstRequestTool";
import { GetRequestTool } from "./mcp/GetRequestTool";

let chatMonitorTreeProvider: ChatMonitorTreeProvider;
let openedDialogTreeProvider: OpenedDialogTreeProvider;
let processedDialogsTreeProvider: ProcessedDialogsTreeProvider;

/**
 * Get the ChatMonitorTreeProvider instance for external access
 */
export function getChatMonitorService(): ChatMonitorTreeProvider {
  if (!chatMonitorTreeProvider) {
    throw new Error(
      "ChatMonitorTreeProvider not initialized. Call activate() first."
    );
  }
  return chatMonitorTreeProvider;
}

/**
 * Get extension version from package.json
 */
function getExtensionVersion(context: vscode.ExtensionContext): string {
  try {
    return context.extension.packageJSON.version;
  } catch (error) {
    console.error("Failed to read extension version:", error);
    return "unknown";
  }
}

export async function activate(context: vscode.ExtensionContext) {
  const extensionVersion = getExtensionVersion(context);

  // Check logging settings
  const config = vscode.workspace.getConfiguration("copilotChatSecretary");
  const enableLogging = config.get<boolean>("enableLogging", false);

  if (enableLogging) {
    logger.info(
      LogCategory.GENERAL,
      `Copilot Chat Secretary v${extensionVersion} activating...`
    );
  }

  console.log(`Copilot Chat Secretary v${extensionVersion} activated`);

  // Create chat-exports directory for storing dialog JSON files
  const chatExportsUri = vscode.Uri.joinPath(
    context.globalStorageUri,
    "chat-exports"
  );
  try {
    await vscode.workspace.fs.createDirectory(chatExportsUri);
    console.log(`Chat exports directory ready: ${chatExportsUri.fsPath}`);
  } catch (error) {
    // Directory may already exist, which is fine
    console.log(`Chat exports directory exists or created`);
  }

  // Create Chat Monitor Tree View Provider
  chatMonitorTreeProvider = new ChatMonitorTreeProvider(context);

  const chatMonitorTreeView = vscode.window.createTreeView(
    "copilotChatSecretaryView",
    {
      treeDataProvider: chatMonitorTreeProvider,
      showCollapseAll: false,
    }
  );

  chatMonitorTreeView.title = `Chat Monitor (v${extensionVersion})`;

  // Create Opened Dialog Tree View Provider
  openedDialogTreeProvider = new OpenedDialogTreeProvider();

  const openedDialogTreeView = vscode.window.createTreeView(
    "copilotChatSecretaryRequestsView",
    {
      treeDataProvider: openedDialogTreeProvider,
      showCollapseAll: true,
    }
  );

  openedDialogTreeView.title = "Opened Dialog";

  // Connect chat monitor to opened dialog provider
  chatMonitorTreeProvider.setOpenedDialogProvider(openedDialogTreeProvider);

  // Create Processed Dialogs Tree View Provider
  processedDialogsTreeProvider = new ProcessedDialogsTreeProvider();
  processedDialogsTreeProvider.setSessionsService(
    chatMonitorTreeProvider.getSessionsService()
  );

  // Connect session recording callback to refresh dialogs list
  chatMonitorTreeProvider.setOnSessionRecorded(() => {
    processedDialogsTreeProvider.refresh();
  });

  const processedDialogsTreeView = vscode.window.createTreeView(
    "copilotChatSecretaryProcessedDialogsView",
    {
      treeDataProvider: processedDialogsTreeProvider,
      showCollapseAll: false,
    }
  );

  processedDialogsTreeView.title = "Dialogs";

  // State tracking for smart refresh (to avoid disrupting hover tooltips)
  let lastKnownState = {
    sessionId: "",
    requestsCount: 0,
    status: "",
    sessionsCount: 0,
  };

  // Register refresh command
  const refreshCommand = vscode.commands.registerCommand(
    COMMANDS.REFRESH_STATUS,
    async () => {
      await chatMonitorTreeProvider.refreshStatus();
      if (enableLogging) {
        logger.info(LogCategory.GENERAL, "Chat status refreshed manually");
      }
    }
  );

  // Register show logs command
  const showLogsCommand = vscode.commands.registerCommand(
    COMMANDS.SHOW_LOGS,
    async () => {
      logger.showLogOutput();
    }
  );

  // Register clear history command
  const clearHistoryCommand = vscode.commands.registerCommand(
    "copilotChatSecretary.clearHistory",
    async () => {
      processedDialogsTreeProvider.clearHistory();
      vscode.window.showInformationMessage("Dialog history cleared");
    }
  );

  // Register refresh dialogs command
  const refreshDialogsCommand = vscode.commands.registerCommand(
    "copilotChatSecretary.refreshDialogs",
    async () => {
      processedDialogsTreeProvider.refresh();
    }
  );

  // Register copy chat JSON command
  const copyChatJsonCommand = vscode.commands.registerCommand(
    "copilotChatSecretary.copyChatJson",
    async (item: {
      record?: { chatJsonPath?: string; sessionId?: string };
    }) => {
      if (!item?.record?.chatJsonPath) {
        vscode.window.showWarningMessage(
          "No chat JSON available for this dialog"
        );
        return;
      }

      try {
        const fileUri = vscode.Uri.file(item.record.chatJsonPath);
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        const jsonContent = Buffer.from(fileContent).toString("utf8");
        await vscode.env.clipboard.writeText(jsonContent);
        vscode.window.showInformationMessage("Chat JSON copied to clipboard");
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to copy chat JSON: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  );

  // Register copy request message command
  const copyRequestMessageCommand = vscode.commands.registerCommand(
    "copilotChatSecretary.copyRequestMessage",
    async (item: {
      tooltip?: string;
      request?: { message?: string };
      turn?: { request?: { message?: string } };
    }) => {
      // Try to get message from tooltip (for dialog request items), turn.request.message (for conversation turn items), or request object
      const message =
        item?.tooltip || item?.turn?.request?.message || item?.request?.message;

      if (!message) {
        vscode.window.showWarningMessage("No message available to copy");
        return;
      }

      try {
        await vscode.env.clipboard.writeText(message);
        vscode.window.showInformationMessage("Message copied to clipboard");
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to copy message: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  );

  // Register copy AI response command
  const copyAIResponseCommand = vscode.commands.registerCommand(
    "copilotChatSecretary.copyAIResponse",
    async (item: { tooltip?: string; response?: { message?: string } }) => {
      // Get response message from tooltip (full text) or response object
      const message = item?.tooltip || item?.response?.message;

      if (!message) {
        vscode.window.showWarningMessage("No AI response available to copy");
        return;
      }

      try {
        await vscode.env.clipboard.writeText(message);
        vscode.window.showInformationMessage("AI response copied to clipboard");
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to copy AI response: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  );

  // Auto-refresh Chat Monitor every 5 seconds (smart refresh - only updates UI when data changes)
  const autoRefreshInterval = setInterval(async () => {
    await chatMonitorTreeProvider.refreshStatus();

    // Get current state
    const currentSessionId =
      chatMonitorTreeProvider.getCurrentSessionId() || "";
    const currentStatus = chatMonitorTreeProvider.getStatusString();
    const currentRequestsCount = chatMonitorTreeProvider.getRequestsCount();
    const currentSessionsCount = chatMonitorTreeProvider
      .getSessionsService()
      .getSessionHistory().length;

    // Only refresh Dialogs view if sessions actually changed
    if (currentSessionsCount !== lastKnownState.sessionsCount) {
      processedDialogsTreeProvider.refresh();
      lastKnownState.sessionsCount = currentSessionsCount;
    }

    // Update tracked state (for future use if needed)
    lastKnownState.sessionId = currentSessionId;
    lastKnownState.status = currentStatus;
    lastKnownState.requestsCount = currentRequestsCount;
  }, 5000);

  // Register external API commands
  const apiCommandDisposables = registerApiCommands(
    chatMonitorTreeProvider,
    chatMonitorTreeProvider.getSessionsService()
  );

  // Register MCP tools
  const getFirstRequestTool = new GetFirstRequestTool(
    chatMonitorTreeProvider,
    chatMonitorTreeProvider.getSessionsService()
  );
  const getRequestTool = new GetRequestTool(
    chatMonitorTreeProvider,
    chatMonitorTreeProvider.getSessionsService(),
    context
  );

  const mcpToolDisposables = [
    vscode.lm.registerTool(getFirstRequestTool.toolName, getFirstRequestTool),
    vscode.lm.registerTool(getRequestTool.toolName, getRequestTool),
  ];

  console.log(
    "MCP tools registered:",
    getFirstRequestTool.toolName,
    getRequestTool.toolName
  );

  // Add subscriptions for cleanup
  context.subscriptions.push(
    chatMonitorTreeView,
    openedDialogTreeView,
    processedDialogsTreeView,
    refreshCommand,
    showLogsCommand,
    clearHistoryCommand,
    refreshDialogsCommand,
    copyChatJsonCommand,
    copyRequestMessageCommand,
    copyAIResponseCommand,
    ...apiCommandDisposables,
    ...mcpToolDisposables,
    {
      dispose: () => {
        clearInterval(autoRefreshInterval);
        chatMonitorTreeProvider.dispose();
      },
    }
  );

  if (enableLogging) {
    logger.info(
      LogCategory.GENERAL,
      "Copilot Chat Secretary activated successfully"
    );
  }
}

export function deactivate() {
  if (chatMonitorTreeProvider) {
    chatMonitorTreeProvider.dispose();
  }
  console.log("Copilot Chat Secretary deactivated");
}
