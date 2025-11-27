import { Command } from 'commander';

export class MonetizeCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setup();
  }

  private setup(): void {
    this.program
      .name('monetizer')
      .description('AI-powered project monetization platform')
      .version('0.1.0');

    // Commands will be added here
  }

  public run(argv?: string[]): void {
    this.program.parse(argv);
  }
}
