// utils/constants.ts - Copilot Chat Secretary
import * as vscode from "vscode";

// Extension version helper
export function getExtensionVersion(): string {
  try {
    const extension = vscode.extensions.getExtension(
      "copilot-chat-secretary.copilot-chat-secretary"
    );
    return extension?.packageJSON?.version || "unknown";
  } catch (error) {
    console.error("Failed to get extension version:", error);
    return "unknown";
  }
}

// Default check interval
export const DEFAULT_CHECK_INTERVAL = 1; // seconds

// Command IDs
export const COMMANDS = {
  REFRESH_STATUS: "copilotChatSecretary.refreshStatus",
  SHOW_LOGS: "copilotChatSecretary.showLogs",
} as const;

// Configuration keys
export const CONFIG_KEYS = {
  CHECK_INTERVAL: "copilotChatSecretary.checkInterval",
  ENABLE_LOGGING: "copilotChatSecretary.enableLogging",
} as const;
