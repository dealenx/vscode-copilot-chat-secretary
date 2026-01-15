// utils/logger.ts - Copilot Chat Secretary
import * as vscode from "vscode";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export enum LogCategory {
  GENERAL = "GENERAL",
  CHAT_MONITOR = "CHAT_MONITOR",
}

export class Logger {
  private static instance: Logger;
  private outputChannel: vscode.OutputChannel;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel(
      "Copilot Chat Secretary"
    );
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private isLoggingEnabled(): boolean {
    const config = vscode.workspace.getConfiguration("copilotChatSecretary");
    return config.get<boolean>("enableLogging", false);
  }

  private formatLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string
  ): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${category}] ${message}`;
  }

  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any
  ): void {
    if (!this.isLoggingEnabled()) {
      return;
    }

    let formattedMessage = this.formatLogEntry(level, category, message);
    if (data) {
      formattedMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
    }

    this.outputChannel.appendLine(formattedMessage);
    console.log(`[CopilotChatSecretary] ${formattedMessage}`);
  }

  public debug(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  public info(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  public warn(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  public error(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  public showLogOutput(): void {
    this.outputChannel.show();
  }

  public clear(): void {
    this.outputChannel.clear();
  }
}

export const logger = Logger.getInstance();
