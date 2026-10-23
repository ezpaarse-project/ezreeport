import {
  mdiAlphabetical,
  mdiCalendarBlank,
  mdiChartArc,
  mdiChartAreasplineVariant,
  mdiChartBar,
  mdiChartLine,
  mdiCounter,
  mdiNoteText,
  mdiNumeric,
  mdiPercent,
  mdiTable,
} from '@mdi/js';

export const formatIcons = new Map([
  ['text', mdiAlphabetical],
  ['number', mdiNumeric],
  ['date', mdiCalendarBlank],
  ['percent', mdiPercent],
] as const);

export const figureIcons = new Map<string, string>([
  ['arc', mdiChartArc],
  ['bar', mdiChartBar],
  ['table', mdiTable],
  ['md', mdiNoteText],
  ['metric', mdiCounter],
  ['area', mdiChartAreasplineVariant],
  ['line', mdiChartLine],
]);
