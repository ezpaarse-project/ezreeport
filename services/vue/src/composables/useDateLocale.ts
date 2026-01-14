import { formatDate, type Locale } from 'date-fns';
import { fr, enGB } from 'date-fns/locale';

const dateFnsLocales: Record<string, Locale> = {
  // keys are i18n locales, values are date-fns locales
  en: enGB,
  fr,
};

export default function useDateLocale() {
  const { locale } = useI18n();

  const dateLocale = computed(() => dateFnsLocales[locale.value]);

  return {
    locale: dateLocale,

    formatDateWithTZ: (date: Date, format: string): string => {
      const tzDate = new Date(
        date.valueOf() + date.getTimezoneOffset() * -60 * 1000
      );

      return formatDate(tzDate, format, {
        locale: dateLocale.value,
      });
    },
  };
}
