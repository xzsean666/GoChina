import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToast } from '../src/composables/useToast';
import { useI18n } from '../src/composables/useI18n';
import { useTheme } from '../src/composables/useTheme';

describe('Frontend Layout & Composables (TASK-011)', () => {
  beforeEach(() => {
    const { toast } = useToast();
    toast.clear();
  });

  it('triggers and clears toast notifications cleanly', () => {
    const { toasts, toast, removeToast } = useToast();

    expect(toasts.value.length).toBe(0);

    const id1 = toast.success('Operation Successful', 'Your changes have been saved.');
    expect(toasts.value.length).toBe(1);
    expect(toasts.value[0].id).toBe(id1);
    expect(toasts.value[0].type).toBe('success');
    expect(toasts.value[0].title).toBe('Operation Successful');

    const id2 = toast.error('Payment Error', 'Insufficient balance');
    expect(toasts.value.length).toBe(2);
    expect(toasts.value[1].id).toBe(id2);
    expect(toasts.value[1].type).toBe('error');

    removeToast(id1);
    expect(toasts.value.length).toBe(1);
    expect(toasts.value[0].id).toBe(id2);

    toast.clear();
    expect(toasts.value.length).toBe(0);
  });

  it('manages multilingual translations reactively', () => {
    const { locale, setLocale, t } = useI18n();

    setLocale('zh');
    expect(locale.value).toBe('zh');
    expect(t('nav.plans')).toBe('订阅套餐');

    setLocale('en');
    expect(locale.value).toBe('en');
    expect(t('nav.plans')).toBe('Plans & Pricing');

    setLocale('ja');
    expect(locale.value).toBe('ja');
    expect(t('nav.plans')).toBe('料金プラン');
  });

  it('toggles dark and light mode', () => {
    const { isDark, toggleTheme } = useTheme();

    const initial = isDark.value;
    toggleTheme();
    expect(isDark.value).toBe(!initial);
    toggleTheme();
    expect(isDark.value).toBe(initial);
  });
});
