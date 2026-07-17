import { I18n, type LocaleCatalog } from 'i18n';

import { type DateArg, formatDate, locales } from '@ezreeport/dates';

import type { Flatten } from './flatten';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

type Locale = 'en' | 'fr';

/** Map between locale code and date-fns locale */
const dateFnsLocales = {
  en: locales.enGB,
  fr: locales.fr,
} as const satisfies Record<Locale, (typeof locales)[keyof typeof locales]>;

const i18n = new I18n({
  staticCatalog: {
    // Casting as unknown cause LocaleCatalog is not accepting object notation
    en: en as unknown as LocaleCatalog,
    fr: fr as unknown as LocaleCatalog,
  },

  objectNotation: true,
  defaultLocale: 'en',
  retryInDefaultLocale: true,
});
export type Phrase = keyof Flatten<typeof en & typeof fr>;

/* oxlint-disable id-length - Matching vue-i18n api */
/**
 * Get translation of given key
 *
 * @param phrase - The key
 * @param locale - The locale to use
 * @param replacements - The replacement to give
 *
 * @returns The translation
 */
export const t = (
  phrase: Phrase,
  locale: Locale,
  replacements: Record<string, string> = {}
): string => i18n.__({ phrase, locale }, replacements);

/**
 * Format date following locale
 *
 * @param date - The date to format
 * @param locale - The locale to use
 * @param format - The format to use, see <https://date-fns.org/docs/format> for allowed tokens
 *
 * @returns The formatted date
 */
export const d = (
  date: DateArg<Date>,
  locale: Locale,
  format = 'PPPpp'
): string => formatDate(date, format, { locale: dateFnsLocales[locale] });
/* oxlint-enable id-length */
