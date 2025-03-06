import type { Locale } from 'date-fns';
import { fr, enGB } from 'date-fns/locale';

const dateFnsLocales: Record<string, Locale> = {
  // keys are i18n locales, values are date-fns locales
  en: enGB,
  fr,
};

export default function useDateLocale() {
  const { locale } = useI18n();

  return {
    locale: computed(() => dateFnsLocales[locale.value]),
  };
}
