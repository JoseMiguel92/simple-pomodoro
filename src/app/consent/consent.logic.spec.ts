import { describe, expect, it } from 'vitest';
import { canPersist, parseConsent } from './consent.logic';

describe('parseConsent', () => {
  it('returns the expected choices', () => {
    expect(parseConsent('accept')).toBe('accept');
    expect(parseConsent('reject')).toBe('reject');
  });

  it('returns null when there is no stored value', () => {
    expect(parseConsent(null)).toBeNull();
  });

  it('returns null for an empty value', () => {
    expect(parseConsent('')).toBeNull();
  });

  it('returns null for corrupt or unreadable values', () => {
    expect(parseConsent('{"choice":"accept"}')).toBeNull();
    expect(parseConsent('\xFF\xFEbinary')).toBeNull();
  });

  it('returns null for values outside the expected ones', () => {
    expect(parseConsent('maybe')).toBeNull();
    expect(parseConsent('yes')).toBeNull();
    expect(parseConsent('ACCEPT')).toBeNull();
    expect(parseConsent(' accept ')).toBeNull();
  });
});

describe('canPersist', () => {
  it('allows persistence only with acceptance', () => {
    expect(canPersist('accept')).toBe(true);
  });

  it('blocks persistence on rejection and without choice', () => {
    expect(canPersist('reject')).toBe(false);
    expect(canPersist(null)).toBe(false);
  });
});
