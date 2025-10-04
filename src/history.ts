import type { ExtensionContext } from "vscode";

export interface HistoryItem {
  command: string;
  label: string;
  detail?: string;
  failed?: boolean;
}

export class History {
  private context: ExtensionContext;
  items: HistoryItem[];

  constructor(context: ExtensionContext) {
    this.context = context;
    this.items = [];
    Object.assign(
      this,
      this.context.globalState.get(context.extension.id, {
        items: [],
      })
    );
  }

  add(item: HistoryItem): void {
    this.delete(item.command);
    this.items.unshift(item);
    this.context.globalState.update(this.context.extension.id, {
      items: this.items,
    });
  }

  get(command: string): HistoryItem | undefined {
    return this.items.find((item) => item.command === command);
  }

  has(command: string): boolean {
    return this.items.some((item) => item.command === command);
  }

  delete(command: string): void {
    const deleteIndex = this.items.findIndex(
      (item) => item.command === command
    );
    if (deleteIndex !== -1) {
      this.items.splice(deleteIndex, 1);
      this.context.globalState.update(this.context.extension.id, {
        items: this.items,
      });
    }
  }

  clear(): void {
    Object.assign(this, { items: [] });
    this.context.globalState.update(this.context.extension.id, {
      items: this.items,
    });
  }
}
