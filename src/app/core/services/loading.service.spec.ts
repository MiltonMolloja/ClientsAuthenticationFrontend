import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingService],
    });

    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with loading false', () => {
    expect(service.loading()).toBe(false);
  });

  describe('show', () => {
    it('should set loading to true', () => {
      service.show();

      expect(service.loading()).toBe(true);
    });

    it('should increment loading counter', () => {
      service.show();
      service.show();
      service.show();

      expect(service['loadingCountSignal']()).toBe(3);
      expect(service.loading()).toBe(true);
    });
  });

  describe('hide', () => {
    it('should set loading to false when counter reaches zero', () => {
      service.show();
      service.hide();

      expect(service.loading()).toBe(false);
    });

    it('should decrement loading counter', () => {
      service.show();
      service.show();
      service.show();

      service.hide();

      expect(service['loadingCountSignal']()).toBe(2);
      expect(service.loading()).toBe(true);
    });

    it('should not go below zero', () => {
      service.hide();
      service.hide();

      expect(service['loadingCountSignal']()).toBe(0);
      expect(service.loading()).toBe(false);
    });

    it('should handle multiple show/hide calls correctly', () => {
      service.show(); // count: 1
      service.show(); // count: 2
      service.hide(); // count: 1
      expect(service.loading()).toBe(true);

      service.hide(); // count: 0
      expect(service.loading()).toBe(false);
    });
  });

  describe('forceHide', () => {
    it('should reset counter and hide loading', () => {
      service.show();
      service.show();
      service.show();

      service.forceHide();

      expect(service['loadingCountSignal']()).toBe(0);
      expect(service.loading()).toBe(false);
    });

    it('should work even when counter is zero', () => {
      service.forceHide();

      expect(service['loadingCountSignal']()).toBe(0);
      expect(service.loading()).toBe(false);
    });
  });

  describe('signal reactivity', () => {
    it('should update loading signal when show is called', () => {
      const initialValue = service.loading();
      expect(initialValue).toBe(false);

      service.show();

      const updatedValue = service.loading();
      expect(updatedValue).toBe(true);
    });

    it('should update loading signal when hide is called', () => {
      service.show();
      expect(service.loading()).toBe(true);

      service.hide();

      expect(service.loading()).toBe(false);
    });

    it('should be readonly', () => {
      const loadingSignal = service.loading;

      // Verify it's a signal function
      expect(typeof loadingSignal).toBe('function');

      // Verify we can read the value
      expect(loadingSignal()).toBe(false);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent API calls', () => {
      // Simulate 3 concurrent API calls
      service.show(); // API call 1 starts
      service.show(); // API call 2 starts
      service.show(); // API call 3 starts

      expect(service.loading()).toBe(true);
      expect(service['loadingCountSignal']()).toBe(3);

      // API call 1 completes
      service.hide();
      expect(service.loading()).toBe(true);
      expect(service['loadingCountSignal']()).toBe(2);

      // API call 2 completes
      service.hide();
      expect(service.loading()).toBe(true);
      expect(service['loadingCountSignal']()).toBe(1);

      // API call 3 completes
      service.hide();
      expect(service.loading()).toBe(false);
      expect(service['loadingCountSignal']()).toBe(0);
    });

    it('should handle error scenarios with forceHide', () => {
      // Simulate multiple API calls
      service.show();
      service.show();
      service.show();

      // Something goes wrong, force hide all
      service.forceHide();

      expect(service.loading()).toBe(false);
      expect(service['loadingCountSignal']()).toBe(0);
    });
  });
});
