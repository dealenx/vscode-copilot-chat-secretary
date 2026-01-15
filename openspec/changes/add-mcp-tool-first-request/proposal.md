# Change: Add MCP Tools for Dialog Request Retrieval

## Why

AI агенты в Copilot Chat часто производят сжатие контекста и теряют запросы пользователя из диалога. Нужны MCP инструменты, которые позволят агенту получить запросы из текущего или указанного диалога, чтобы восстановить контекст.

## What Changes

- Добавление базового абстрактного класса `Tool` для всех MCP инструментов
- Реализация MCP tool `copilot_chat_secretary_get_first_request` для получения первого запроса диалога
- Реализация MCP tool `copilot_chat_secretary_get_request` для получения запроса по позиции/индексу
- Инструменты поддерживают получение из:
  - Текущего активного диалога (без параметров)
  - Конкретного диалога по sessionId
- Регистрация MCP tools через VS Code Language Model API (`vscode.lm.registerTool`)
- Детальные описания инструментов для AI агента с инструкциями по использованию

## Impact

- Affected specs: mcp-tools (новый)
- Affected code:
  - Новый `src/mcp/Tool.ts` - базовый класс
  - Новый `src/mcp/GetFirstRequestTool.ts` - первый запрос
  - Новый `src/mcp/GetRequestTool.ts` - запрос по индексу
  - `src/extension.ts` - регистрация MCP tools
  - `package.json` - возможно добавление активации для `onLanguageModelTool`
