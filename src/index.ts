import { type ExtensionContext, commands } from "vscode";

import { History } from "./history.js";
import { runCommand } from "./run-command.js";

export function activate(context: ExtensionContext) {
  console.debug("Shell Pipe extension is activated.");

  const history = new History(context);

  context.subscriptions.push(
    commands.registerCommand("shell-pipe.runCommand", () => runCommand(history)),
    commands.registerCommand("shell-pipe.clearHistory", history.clear)
  );
}

export function deactivate() {}
