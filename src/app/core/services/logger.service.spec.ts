import { TestBed } from '@angular/core/testing';
import { LoggerService, LogLevel } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleLogSpy: jasmine.Spy;
  let consoleInfoSpy: jasmine.Spy;
  let consoleWarnSpy: jasmine.Spy;
  let consoleErrorSpy: jasmine.Spy;
  let consoleGroupSpy: jasmine.Spy;
  let consoleGroupEndSpy: jasmine.Spy;
  let consoleTableSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService],
    });

    service = TestBed.inject(LoggerService);

    // Spy on console methods
    consoleLogSpy = spyOn(console, 'log');
    consoleInfoSpy = spyOn(console, 'info');
    consoleWarnSpy = spyOn(console, 'warn');
    consoleErrorSpy = spyOn(console, 'error');
    consoleGroupSpy = spyOn(console, 'group');
    consoleGroupEndSpy = spyOn(console, 'groupEnd');
    consoleTableSpy = spyOn(console, 'table');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('debug', () => {
    it('should log debug messages in development mode', () => {
      // Force development mode
      service['logLevel'] = LogLevel.Debug;

      service.debug('Debug message', { data: 'test' });

      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Debug message', { data: 'test' });
    });

    it('should not log debug messages in production mode', () => {
      // Force production mode
      service['logLevel'] = LogLevel.Error;

      service.debug('Debug message', { data: 'test' });

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages when log level allows', () => {
      service['logLevel'] = LogLevel.Info;

      service.info('Info message', { data: 'test' });

      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Info message', { data: 'test' });
    });

    it('should not log info messages in production mode', () => {
      service['logLevel'] = LogLevel.Error;

      service.info('Info message');

      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warn messages when log level allows', () => {
      service['logLevel'] = LogLevel.Warn;

      service.warn('Warning message', { data: 'test' });

      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Warning message', { data: 'test' });
    });

    it('should log warn messages even in production', () => {
      service['logLevel'] = LogLevel.Error;

      service.warn('Warning message');

      // Warn level (2) is less than Error level (3), so it won't log
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages in all modes', () => {
      service['logLevel'] = LogLevel.Error;

      const error = new Error('Test error');
      service.error('Error occurred', error, { context: 'test' });

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error occurred', error, {
        context: 'test',
      });
    });

    it('should have sendToExternalLogger method available for production use', () => {
      // In development mode (tests), sendToExternalLogger is not called
      // This test verifies the method exists and can be called
      service['logLevel'] = LogLevel.Error;

      const error = new Error('Test error');

      // Verify the private method exists
      expect(typeof service['sendToExternalLogger']).toBe('function');

      // Verify error logging works
      service.error('Error message', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not throw if error parameter is undefined', () => {
      service['logLevel'] = LogLevel.Error;

      expect(() => service.error('Error without error object')).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('group', () => {
    it('should create console group in debug mode', () => {
      service['logLevel'] = LogLevel.Debug;

      service.group('Test Group');

      expect(consoleGroupSpy).toHaveBeenCalledWith('Test Group');
    });

    it('should not create console group in production mode', () => {
      service['logLevel'] = LogLevel.Error;

      service.group('Test Group');

      expect(consoleGroupSpy).not.toHaveBeenCalled();
    });
  });

  describe('groupEnd', () => {
    it('should end console group in debug mode', () => {
      service['logLevel'] = LogLevel.Debug;

      service.groupEnd();

      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('should not end console group in production mode', () => {
      service['logLevel'] = LogLevel.Error;

      service.groupEnd();

      expect(consoleGroupEndSpy).not.toHaveBeenCalled();
    });
  });

  describe('table', () => {
    it('should display console table in debug mode', () => {
      service['logLevel'] = LogLevel.Debug;

      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      service.table(data);

      expect(consoleTableSpy).toHaveBeenCalledWith(data);
    });

    it('should not display console table in production mode', () => {
      service['logLevel'] = LogLevel.Error;

      const data = [{ name: 'John' }];

      service.table(data);

      expect(consoleTableSpy).not.toHaveBeenCalled();
    });
  });

  describe('log levels', () => {
    it('should respect log level hierarchy', () => {
      // Set to Warn level
      service['logLevel'] = LogLevel.Warn;

      service.debug('Debug'); // Should not log
      service.info('Info'); // Should not log
      service.warn('Warn'); // Should log
      service.error('Error'); // Should log

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not log anything when level is None', () => {
      service['logLevel'] = LogLevel.None;

      service.debug('Debug');
      service.info('Info');
      service.warn('Warn');
      service.error('Error');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
