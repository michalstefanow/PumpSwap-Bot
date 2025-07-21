import pino from 'pino';
import { logger } from './logger';

/**
 * Retrieves an environment variable with proper error handling
 * @param variableName - The name of the environment variable
 * @param loggerInstance - Logger instance for error reporting
 * @returns The environment variable value
 * @throws Error if the environment variable is not set
 */
export function retrieveEnvVariable(variableName: string, loggerInstance: pino.Logger = logger): string {
  const variable = process.env[variableName];
  if (!variable) {
    const error = `${variableName} is not set in environment variables`;
    loggerInstance.error(error);
    throw new Error(error);
  }
  return variable;
}

/**
 * Retrieves an environment variable with a default value
 * @param variableName - The name of the environment variable
 * @param defaultValue - Default value if environment variable is not set
 * @returns The environment variable value or default value
 */
export function retrieveEnvVariableWithDefault(variableName: string, defaultValue: string): string {
  return process.env[variableName] || defaultValue;
}

/**
 * Retrieves a numeric environment variable
 * @param variableName - The name of the environment variable
 * @param defaultValue - Default value if environment variable is not set or invalid
 * @returns The numeric value
 */
export function retrieveNumericEnvVariable(variableName: string, defaultValue: number): number {
  const value = process.env[variableName];
  if (!value) return defaultValue;
  
  const numericValue = parseInt(value, 10);
  return isNaN(numericValue) ? defaultValue : numericValue;
}

/**
 * Validates that all required environment variables are set
 * @param requiredVariables - Array of required environment variable names
 * @param loggerInstance - Logger instance for error reporting
 * @throws Error if any required variable is missing
 */
export function validateRequiredEnvVariables(requiredVariables: string[], loggerInstance: pino.Logger = logger): void {
  const missingVariables: string[] = [];
  
  for (const variable of requiredVariables) {
    if (!process.env[variable]) {
      missingVariables.push(variable);
    }
  }
  
  if (missingVariables.length > 0) {
    const error = `Missing required environment variables: ${missingVariables.join(', ')}`;
    loggerInstance.error(error);
    throw new Error(error);
  }
} 