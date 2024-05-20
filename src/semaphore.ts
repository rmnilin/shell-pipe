export class Semaphore {
  private tasks: (() => void)[] = [];
  private count: number;

  constructor(count: number) {
    this.count = count;
  }

  public acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.count > 0) {
        this.count--;
        resolve();
      } else {
        this.tasks.push(resolve);
      }
    });
  }

  public release(): void {
    if (this.tasks.length > 0) {
      const nextTask = this.tasks.shift();
      nextTask && nextTask();
    } else {
      this.count++;
    }
  }
}
