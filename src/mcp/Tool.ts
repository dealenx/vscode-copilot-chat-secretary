// mcp/Tool.ts - Base abstract class for MCP tools
import * as vscode from "vscode";

/**
 * Base abstract class for all MCP tools
 * Implements vscode.LanguageModelTool interface with error handling
 */
export abstract class Tool implements vscode.LanguageModelTool<object> {
  abstract toolName: string;

  /**
   * Main invoke method that handles tool execution with error handling
   * Calls the abstract call() method implemented by concrete tools
   */
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<object>,
    token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    try {
      const response = await this.call(options, token);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(response),
      ]);
    } catch (error) {
      const errorPayload = {
        isError: true,
        message: error instanceof Error ? error.message : String(error),
      };
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(JSON.stringify(errorPayload)),
      ]);
    }
  }

  /**
   * Abstract method to be implemented by concrete tools
   * Should return JSON string response
   */
  abstract call(
    options: vscode.LanguageModelToolInvocationOptions<object>,
    token: vscode.CancellationToken
  ): Promise<string>;

  /**
   * Helper method to format successful JSON response
   */
  protected formatSuccess(data: object): string {
    return JSON.stringify({ success: true, ...data });
  }

  /**
   * Helper method to format error JSON response
   */
  protected formatError(error: string): string {
    return JSON.stringify({ success: false, error });
  }
}
