// extension.ts - Copilot Chat Secretary
import * as vscode from "vscode";
import { ChatMonitorTreeProvider } from "./providers/chatMonitorTreeProvider";
import { RequestsTreeProvider } from "./providers/requestsTreeProvider";
import { ProcessedDialogsTreeProvider } from "./providers/processedDialogsTreeProvider";
import { logger, LogCategory } from "./utils/logger";
import { COMMANDS } from "./utils/constants";

let chatMonitorTreeProvider: ChatMonitorTreeProvider;
let requestsTreeProvider: RequestsTreeProvider;
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

  // Create Requests Tree View Provider
  requestsTreeProvider = new RequestsTreeProvider();

  const requestsTreeView = vscode.window.createTreeView(
    "copilotChatSecretaryRequestsView",
    {
      treeDataProvider: requestsTreeProvider,
      showCollapseAll: false,
    }
  );

  requestsTreeView.title = "User Requests";

  // Connect chat monitor to requests provider
  chatMonitorTreeProvider.setRequestsProvider(requestsTreeProvider);

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

  // Add subscriptions for cleanup
  context.subscriptions.push(
    chatMonitorTreeView,
    requestsTreeView,
    processedDialogsTreeView,
    refreshCommand,
    showLogsCommand,
    clearHistoryCommand,
    refreshDialogsCommand,
    {
      dispose: () => {
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
