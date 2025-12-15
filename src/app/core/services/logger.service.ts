import { Injectable, isDevMode } from '@angular/core';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  None = 4,
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private logLevel: LogLevel = isDevMode() ? LogLevel.Debug : LogLevel.Error;

  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.Debug) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.Info) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.Warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: any, ...args: any[]): void {
    if (this.logLevel <= LogLevel.Error) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }

    // En producción, aquí podrías enviar a un servicio de logging externo
    // como Sentry, LogRocket, etc.
    if (!isDevMode() && error) {
      this.sendToExternalLogger(message, error);
    }
  }

  group(label: string): void {
    if (this.logLevel <= LogLevel.Debug) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.logLevel <= LogLevel.Debug) {
      console.groupEnd();
    }
  }

  table(data: any): void {
    if (this.logLevel <= LogLevel.Debug) {
      console.table(data);
    }
  }

  private sendToExternalLogger(message: string, error: any): void {
    // TODO: Implementar integración con servicio externo
    // Ejemplo: Sentry.captureException(error);
  }
}
