import chalk from 'chalk';

export function displayScore(score: number, label: string): void {
  const normalizedScore = Math.min(Math.max(Math.round(score), 0), 10);
  const bars = '#'.repeat(normalizedScore) + '-'.repeat(10 - normalizedScore);

  let color: (text: string) => string;
  if (normalizedScore >= 7) {
    color = chalk.green;
  } else if (normalizedScore >= 4) {
    color = chalk.yellow;
  } else {
    color = chalk.red;
  }

  console.log(`${label}: ${color(`[${bars}]`)} ${normalizedScore}/10`);
}

export function displayHeader(text: string): void {
  const border = '='.repeat(text.length + 4);
  console.log('\n' + chalk.cyan(border));
  console.log(chalk.cyan('| ') + chalk.bold.white(text) + chalk.cyan(' |'));
  console.log(chalk.cyan(border) + '\n');
}

export function displaySection(title: string, content: string[]): void {
  console.log(chalk.bold.white(`\n${title}`));
  console.log(chalk.dim('-'.repeat(50)));
  content.forEach(line => console.log(`  ${line}`));
}

export function displaySuccess(message: string): void {
  console.log(chalk.green(`[OK] ${message}`));
}

export function displayError(message: string): void {
  console.error(chalk.red(`[ERROR] ${message}`));
}

export function displayWarning(message: string): void {
  console.warn(chalk.yellow(`[WARN] ${message}`));
}

export function displayInfo(message: string): void {
  console.log(chalk.blue(`[INFO] ${message}`));
}

export function displayKeyValue(key: string, value: string | number): void {
  console.log(`${chalk.dim(key + ':')} ${chalk.white(value)}`);
}

export function displayList(items: string[], bullet: string = '-'): void {
  items.forEach(item => {
    console.log(`  ${chalk.cyan(bullet)} ${item}`);
  });
}

export function displayProgress(current: number, total: number, label?: string): void {
  const percent = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * 20);
  const empty = 20 - filled;
  const bar = '#'.repeat(filled) + '-'.repeat(empty);

  const labelText = label ? `${label}: ` : '';
  console.log(`${labelText}${chalk.cyan(`[${bar}]`)} ${percent}% (${current}/${total})`);
}

export function displayDivider(char: string = '-', length: number = 50): void {
  console.log(chalk.dim(char.repeat(length)));
}

export function displayMonetizationPotential(score: number): void {
  let message: string;
  let color: (text: string) => string;

  if (score >= 8) {
    message = 'Excellent monetization potential';
    color = chalk.green.bold;
  } else if (score >= 6) {
    message = 'Good monetization potential';
    color = chalk.green;
  } else if (score >= 4) {
    message = 'Moderate monetization potential';
    color = chalk.yellow;
  } else {
    message = 'Limited monetization potential - needs strategy';
    color = chalk.red;
  }

  console.log(`\n${color(message)}\n`);
}

export function displayTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((header, i) => {
    const columnValues = [header, ...rows.map(row => row[i] || '')];
    return Math.max(...columnValues.map(v => v.length));
  });

  const headerRow = headers
    .map((h, i) => h.padEnd(widths[i]))
    .join('  ');
  console.log(chalk.bold.white(headerRow));
  console.log(chalk.dim('-'.repeat(headerRow.length)));

  rows.forEach(row => {
    const formattedRow = row
      .map((cell, i) => cell.padEnd(widths[i]))
      .join('  ');
    console.log(formattedRow);
  });
}

export function displayJSON(data: any, indent: number = 2): void {
  console.log(JSON.stringify(data, null, indent));
}

export function clearConsole(): void {
  console.clear();
}
