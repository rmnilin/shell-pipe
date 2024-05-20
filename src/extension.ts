import * as vscode from "vscode";

import { Cache } from "./cache";
import { clearHistory } from "./clear-history";
import { runCommand } from "./run-command";

export function activate(context: vscode.ExtensionContext) {
  console.log("Shell Pipe extension is activated.");

  const cache = new Cache(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("shell-pipe.runCommand", () =>
      runCommand(cache)
    ),
    vscode.commands.registerCommand("shell-pipe.clearHistory", () =>
      clearHistory(cache)
    )
  );
}

export function deactivate() {}
