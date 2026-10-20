import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY } from './timer.model';
import { createState } from './timer.logic';
import { TimerStorageService } from './timer-storage.service';

describe('TimerStorageService', () => {
  let service: TimerStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimerStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to the defaults when nothing is stored', () => {
    expect(service.load()).toEqual({ focusMinutes: 25, breakMinutes: 5, phase: 'focus' });
  });

  it('writes times and phase (never the running instant) and reads them back', () => {
    service.save({ ...createState(40, 10, 'break'), running: true });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual({
      focusMinutes: 40,
      breakMinutes: 10,
      phase: 'break',
    });
    expect(service.load()).toEqual({ focusMinutes: 40, breakMinutes: 10, phase: 'break' });
  });

  it('normalises a value that is out of range on read (CA-8.3)', () => {
    localStorage.setItem(STORAGE_KEY, '{"focusMinutes":0,"breakMinutes":61,"phase":"break"}');

    expect(service.load()).toEqual({ focusMinutes: 25, breakMinutes: 5, phase: 'break' });
  });

  it('degrades to the defaults when reading throws (private mode)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(service.load()).toEqual({ focusMinutes: 25, breakMinutes: 5, phase: 'focus' });
  });

  it('degrades silently when writing throws (quota)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => service.save(createState())).not.toThrow();
  });
});
