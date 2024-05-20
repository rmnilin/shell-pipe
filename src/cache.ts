import * as vscode from "vscode";

export interface HistoryItem {
  command: string;
  label: string;
  detail?: string;
  failed?: boolean;
}

export class Cache {
  context: vscode.ExtensionContext;
  history!: Array<HistoryItem>;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    Object.assign(
      this,
      this.context.globalState.get(context.extension.id, {
        history: [],
      })
    );
  }

  add(newItem: HistoryItem): void {
    this.delete(newItem.command);
    this.history.unshift(newItem);
    this.context.globalState.update(this.context.extension.id, {
      history: this.history,
    });
  }

  get(command: string): HistoryItem | undefined {
    return this.history.find((item) => item.command === command);
  }

  has(command: string): boolean {
    return this.history.some((item) => item.command === command);
  }

  delete(command: string): void {
    const deleteIndex = this.history.findIndex(
      (item) => item.command === command
    );
    if (deleteIndex !== -1) {
      this.history.splice(deleteIndex, 1);
      this.context.globalState.update(this.context.extension.id, {
        history: this.history,
      });
    }
  }

  clear(): void {
    Object.assign(this, { history: [] });
    this.context.globalState.update(this.context.extension.id, {
      history: this.history,
    });
  }
}
