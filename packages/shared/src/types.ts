/**
 * Shared types across all packages
 */

export interface BaseConfig {
  projectPath: string;
  outputPath?: string;
}

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}
