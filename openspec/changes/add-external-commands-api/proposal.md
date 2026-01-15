# Change: Add External Commands API

## Why

Другие VS Code расширения не имеют способа программно получить данные о статусе и истории Copilot чата. Commands API позволит интеграцию без прямых зависимостей.

## What Changes

- Добавление новых команд для внешнего доступа к данным
- `copilotChatSecretary.api.getStatus` — текущий статус чата
- `copilotChatSecretary.api.getCurrentDialog` — текущий активный диалог
- `copilotChatSecretary.api.getDialogHistory` — история диалогов с фильтрацией
- `copilotChatSecretary.api.getSession` — получение сессии по ID
- Добавление типов для API в публичный интерфейс

## Impact

- Affected specs: commands-api (новый)
- Affected code: `src/extension.ts`, `package.json`, новый `src/api/commandsApi.ts`
