import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCountdown } from '../src/composables/useCountdown';
import QRCode from 'qrcode';

describe('Frontend Crypto Checkout & Composables (TASK-013)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats countdown timer smoothly until expiration', () => {
    const now = Date.now();
    const targetMs = now + 125 * 1000; // 2 minutes 5 seconds

    const { remainingSeconds, minutes, seconds, formatted, isExpired } = useCountdown(targetMs);

    expect(remainingSeconds.value).toBe(125);
    expect(minutes.value).toBe(2);
    expect(seconds.value).toBe(5);
    expect(formatted.value).toBe('02:05');
    expect(isExpired.value).toBe(false);

    // Advance 65 seconds
    vi.advanceTimersByTime(65 * 1000);
    expect(remainingSeconds.value).toBe(60);
    expect(formatted.value).toBe('01:00');
    expect(isExpired.value).toBe(false);

    // Advance remaining 60 seconds
    vi.advanceTimersByTime(60 * 1000);
    expect(remainingSeconds.value).toBe(0);
    expect(formatted.value).toBe('00:00');
    expect(isExpired.value).toBe(true);
  });

  it('generates scannable QR code data URL cleanly', async () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const dataUrl = await QRCode.toDataURL(address, { width: 200 });

    expect(dataUrl).toContain('data:image/png;base64,');
    expect(dataUrl.length).toBeGreaterThan(100);
  });
});
