import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createState } from './timer.logic';
import { STORAGE_KEY } from './timer.model';
import { CONSENT_KEY, PALETTE_KEY, TimerStorageService } from './timer-storage.service';

describe('TimerStorageService', () => {
  let service: TimerStorageService;

  const storedJson = '{"focusMinutes":40,"breakMinutes":10,"phase":"break"}';
  const storedState = { focusMinutes: 40, breakMinutes: 10, phase: 'break' };
  const defaults = { focusMinutes: 25, breakMinutes: 5, phase: 'focus' };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimerStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to the defaults when nothing is stored', () => {
    expect(service.load()).toEqual(defaults);
  });

  it('returns the defaults even when data exists but there is no choice (RF-5)', () => {
    localStorage.setItem(STORAGE_KEY, storedJson);

    expect(service.load()).toEqual(defaults);
  });

  it('returns the defaults while a rejection stands (CA-3.3)', () => {
    localStorage.setItem(STORAGE_KEY, storedJson);
    service.writeConsent('reject');

    expect(service.load()).toEqual(defaults);
  });

  it('writes times and phase (never the running instant) and reads them back once accepted', () => {
    service.writeConsent('accept');
    service.save({ ...createState(40, 10, 'break'), running: true });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual(storedState);
    expect(service.load()).toEqual(storedState);
  });

  it('does not write anything while there is no choice (CA-5.1)', () => {
    service.save(createState(40, 10, 'break'));

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('does not overwrite stored data with a rejection (CA-3.2)', () => {
    localStorage.setItem(STORAGE_KEY, storedJson);
    service.writeConsent('reject');

    service.save(createState(25, 5, 'focus'));

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual(storedState);
  });

  it('normalises a value that is out of range on read (CA-8.3)', () => {
    service.writeConsent('accept');
    localStorage.setItem(STORAGE_KEY, '{"focusMinutes":0,"breakMinutes":61,"phase":"break"}');

    expect(service.load()).toEqual({ focusMinutes: 25, breakMinutes: 5, phase: 'break' });
  });

  it('reads only the expected choices, treating corrupt values as none (RF-7)', () => {
    localStorage.setItem(CONSENT_KEY, 'accept');
    expect(service.readConsent()).toBe('accept');

    localStorage.setItem(CONSENT_KEY, 'reject');
    expect(service.readConsent()).toBe('reject');

    localStorage.setItem(CONSENT_KEY, '{"choice":"accept"}');
    expect(service.readConsent()).toBeNull();
  });

  it('stores the choice and forgets it again (CA-5.2, RF-6)', () => {
    service.writeConsent('reject');
    expect(service.readConsent()).toBe('reject');

    service.clearConsent();
    expect(service.readConsent()).toBeNull();
  });

  it('wipes app data but keeps the choice and foreign keys (RF-3)', () => {
    localStorage.setItem(STORAGE_KEY, storedJson);
    localStorage.setItem('other.key', 'keep me');
    service.writeConsent('accept');

    service.wipeAppData();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('other.key')).toBe('keep me');
    expect(service.readConsent()).toBe('accept');
  });

  it('expires this origin cookies when wiping (CA-3.1)', () => {
    document.cookie = 'app.session=1; path=/';
    expect(document.cookie).toBe('app.session=1');

    service.wipeAppData();

    expect(document.cookie).toBe('');
  });

  it('restores the stored palette once accepted (CA-4.2)', () => {
    service.writeConsent('accept');
    localStorage.setItem(PALETTE_KEY, 'noche');

    expect(service.loadPalette()).toBe('noche');
  });

  it('returns Sereno without an accepted choice or with nothing stored (CA-5.2)', () => {
    localStorage.setItem(PALETTE_KEY, 'noche');
    expect(service.loadPalette()).toBe('sereno');

    service.writeConsent('reject');
    expect(service.loadPalette()).toBe('sereno');

    service.writeConsent('accept');
    localStorage.removeItem(PALETTE_KEY);
    expect(service.loadPalette()).toBe('sereno');
  });

  it('treats a corrupt or unknown stored palette as Sereno, silently (CA-7.1)', () => {
    service.writeConsent('accept');

    for (const raw of ['', 'gamma', 'SERENO', '{"id":"noche"}']) {
      localStorage.setItem(PALETTE_KEY, raw);
      expect(service.loadPalette()).toBe('sereno');
    }
  });

  it('writes the palette immediately once accepted (CA-4.1)', () => {
    service.writeConsent('accept');

    service.writePalette('bosque');

    expect(localStorage.getItem(PALETTE_KEY)).toBe('bosque');
    expect(service.loadPalette()).toBe('bosque');
  });

  it('does not write the palette without an accepted choice (CA-5.1)', () => {
    service.writePalette('bosque');
    expect(localStorage.getItem(PALETTE_KEY)).toBeNull();

    service.writeConsent('reject');
    service.writePalette('bosque');
    expect(localStorage.getItem(PALETTE_KEY)).toBeNull();
  });

  it('deletes the stored palette when wiping app data, keeping the choice (CA-6.1)', () => {
    service.writeConsent('accept');
    localStorage.setItem(PALETTE_KEY, 'noche');
    localStorage.setItem(STORAGE_KEY, storedJson);

    service.wipeAppData();

    expect(localStorage.getItem(PALETTE_KEY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(service.readConsent()).toBe('accept');
  });

  it('falls back to Sereno when reading the palette throws (CL-3)', () => {
    service.writeConsent('accept');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(service.loadPalette()).toBe('sereno');
  });

  it('degrades silently when writing the palette throws (CL-3)', () => {
    service.writeConsent('accept');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => service.writePalette('noche')).not.toThrow();
  });

  it('degrades to the defaults when reading throws (private mode)', () => {
    service.writeConsent('accept');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(service.load()).toEqual(defaults);
  });

  it('degrades silently when writing throws (quota)', () => {
    service.writeConsent('accept');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => service.save(createState())).not.toThrow();
  });

  it('runs every operation without exceptions when storage throws (CL-7)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(service.readConsent()).toBeNull();
    expect(service.load()).toEqual(defaults);
    expect(() => service.save(createState())).not.toThrow();
    expect(() => service.writeConsent('accept')).not.toThrow();
    expect(() => service.clearConsent()).not.toThrow();
    expect(() => service.wipeAppData()).not.toThrow();
    expect(service.loadPalette()).toBe('sereno');
    expect(() => service.writePalette('noche')).not.toThrow();
  });
});
