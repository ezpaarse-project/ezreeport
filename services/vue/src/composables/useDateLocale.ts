import { type Locale, formatDate } from 'date-fns';
import { enGB, fr } from 'date-fns/locale';

const dateFnsLocales: Record<string, Locale> = {
  // Keys are i18n locales, values are date-fns locales
  en: enGB,
  fr,
};

export default function useDateLocale() {
  const { locale } = useI18n();

  const dateLocale = computed(() => dateFnsLocales[locale.value]);

  return {
    formatDate: (date: Date, format: string): string =>
      formatDate(date, format, { locale: dateLocale.value }),

    formatDateWithTZ: (date: Date, format: string): string => {
      const tzDate = new Date(
        date.valueOf() + date.getTimezoneOffset() * -60 * 1000
      );

      return formatDate(tzDate, format, {
        locale: dateLocale.value,
      });
    },

    locale: dateLocale,
  };
}
