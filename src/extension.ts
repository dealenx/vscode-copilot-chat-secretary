// extension.ts - Copilot Chat Secretary
import * as vscode from "vscode";
import { ChatMonitorTreeProvider } from "./providers/chatMonitorTreeProvider";
import { logger, LogCategory } from "./utils/logger";
import { COMMANDS } from "./utils/constants";

let chatMonitorTreeProvider: ChatMonitorTreeProvider;

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

  // Add subscriptions for cleanup
  context.subscriptions.push(
    chatMonitorTreeView,
    refreshCommand,
    showLogsCommand,
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
