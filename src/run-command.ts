import { exec } from "child_process";

import * as vscode from "vscode";

import type { Cache, HistoryItem } from "./cache";
import { clearHistory } from "./clear-history";
import { escapeIcons } from "./icons";
import { Semaphore } from "./semaphore";

function updateQuickPick(
  quickPick: vscode.QuickPick<vscode.QuickPickItem>,
  options: Partial<typeof quickPick>
): void {
  Object.assign(quickPick, options);
}

function updateQuickPickItems(
  quickPick: vscode.QuickPick<vscode.QuickPickItem>,
  cache: Cache
) {
  const historyItems = cache.history.map((item) => ({
    ...item,
    iconPath: new vscode.ThemeIcon("history"),
    description: item.failed ? "$(warning) Failed last time" : undefined,
    buttons: [
      {
        iconPath: new vscode.ThemeIcon("files"),
        tooltip: "Copy to Input",
      },
      {
        iconPath: new vscode.ThemeIcon("edit"),
        tooltip: "Edit",
      },
      {
        iconPath: new vscode.ThemeIcon("trash"),
        tooltip: "Delete",
      },
    ],
  }));

  if (quickPick.value === "" || cache.has(quickPick.value)) {
    updateQuickPick(quickPick, {
      items: historyItems,
    });
  } else {
    updateQuickPick(quickPick, {
      items: [
        {
          // @ts-expect-error
          command: quickPick.value,
          label: escapeIcons(quickPick.value),
          alwaysShow: true,
          iconPath: new vscode.ThemeIcon("plus"),
        },
        ...historyItems,
      ],
    });
  }
}

function editDetail(item: HistoryItem, cache: Cache): void {
  const inputBox = vscode.window.createInputBox();

  Object.assign<typeof inputBox, Partial<typeof inputBox>>(inputBox, {
    title: `Edit Details of \`${item.label}\``,
    value: item.detail,
    buttons: [vscode.QuickInputButtons.Back],
  });

  inputBox.onDidTriggerButton((button) => {
    if (button === vscode.QuickInputButtons.Back) {
      inputBox.hide();
    }
  });

  inputBox.onDidAccept(() => {
    inputBox.hide();
    cache.get(item.command)!.detail = inputBox.value;
    runCommand(cache);
  });

  inputBox.onDidHide(() => {
    inputBox.dispose();
    runCommand(cache);
  });

  inputBox.show();
}

export async function runCommand(cache: Cache): Promise<void> {
  const quickPick = vscode.window.createQuickPick();

  updateQuickPick(quickPick, {
    title: "Run Command",
    buttons: [
      {
        iconPath: new vscode.ThemeIcon("clear-all"),
        tooltip: "Clear History",
      },
    ],
    placeholder: "Select a command or enter a new one",
    matchOnDetail: true,
  });
  updateQuickPickItems(quickPick, cache);

  quickPick.onDidTriggerButton((button) => {
    if (button.tooltip === "Clear History") {
      clearHistory(cache);
      updateQuickPickItems(quickPick, cache);
    }
  });

  quickPick.onDidTriggerItemButton((event) => {
    const command = (event.item as HistoryItem).command;

    switch (event.button.tooltip) {
      case "Copy to Input":
        quickPick.value = command;
        break;

      case "Edit":
        editDetail(event.item as HistoryItem, cache);
        break;

      case "Delete":
        cache.delete(command);
        updateQuickPickItems(quickPick, cache);
        break;
    }
  });

  quickPick.onDidChangeValue((input) => {
    updateQuickPickItems(quickPick, cache);
  });

  const command = await new Promise<HistoryItem | null>((resolve) => {
    quickPick.onDidAccept(() => {
      quickPick.hide();
      resolve(quickPick.activeItems[0] as HistoryItem);
    });

    quickPick.onDidHide(() => {
      quickPick.dispose();
      resolve(null);
    });

    quickPick.show();
  });

  if (command === null) {
    return;
  }

  cache.add(command);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Running command...",
      cancellable: true,
    },
    async (progress, cancellationToken) => {
      const editor = vscode.window.activeTextEditor!;
      const semaphore = new Semaphore(1);
      await Promise.all(
        editor.selections.map(async (selection, i) => {
          const result = await new Promise<string>((resolve, reject) => {
            const process = exec(command.command, (error, stdout, stderr) => {
              if (error) {
                command.failed = true;
                console.error(error, stderr);
                reject(error);
              }
              if (stderr !== "") {
                console.error(stderr);
              }
              resolve(stdout);
            });

            process.stdin?.write(editor.document.getText(selection));
            process.stdin?.end();

            cancellationToken.onCancellationRequested(() => {
              process.kill();
              reject(new Error("Cancelled"));
            });
          }).then((result) => {
            const trimLastNewline = vscode.workspace
              .getConfiguration("shell-pipe")
              .get<boolean>("trimLastNewline", true);
            return trimLastNewline ? result.replace(/\n$/, "") : result;
          });

          await semaphore.acquire();
          await editor.edit((editBuilder) => {
            editBuilder.replace(editor.selections[i], result);
            progress.report({ increment: 100 / editor.selections.length });
          });
          semaphore.release();
        })
      );
    }
  );
}
