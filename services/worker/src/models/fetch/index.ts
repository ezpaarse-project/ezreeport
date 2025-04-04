import type { estypes as ElasticTypes } from '@elastic/elasticsearch';

import { asyncWithCommonHandlers } from '@ezreeport/models/lib/utils';

import type { RecurrenceType } from '@ezreeport/models/recurrence';
import type { FigureType, FilterType } from '@ezreeport/models/templates';
import type { ReportPeriodType } from '@ezreeport/models/reports';

import { elasticMSearch } from '~/lib/elastic';

import { calcElasticIntervalFromRecurrence } from '~/models/recurrence';

import { prepareEsQuery } from './filters';
import { prepareEsAggregations } from './aggs';
import { handleEsResponse } from './results';

type ElasticFetchOptionsType = {
  recurrence: RecurrenceType;
  period: ReportPeriodType;
  auth: {
    username: string;
  };
  dateField: string;
  index: string;
  filters?: FilterType[];
  figures: FigureType[];
};

type FigureWithId = FigureType & { _: { id: number } };

/**
 * Fetch data from Elastic for the given figures
 *
 * @param options Options to fetch data
 *
 * @returns The data
 */
// eslint-disable-next-line import/prefer-default-export
export async function fetchElastic(options: ElasticFetchOptionsType) {
  if (!options.index) {
    throw new Error('Missing index');
  }

  const calendarInterval = calcElasticIntervalFromRecurrence(options.recurrence);

  const figures = options.figures
    .map((f, i): FigureWithId => ({ ...f, _: { id: i } }))
    .filter((f) => f.type !== 'md');

  const requests: ElasticTypes.MsearchMultisearchBody[] = figures.map((f) => {
    const query = prepareEsQuery(
      [options.filters, f.filters].filter((x) => !!x).flat(), // Merge filters
      options.dateField,
      options.period,
    );

    const aggregations = prepareEsAggregations(f, options.dateField, calendarInterval);

    return {
      query,
      aggregations,
      size: 0,
      track_total_hits: true,
    };
  });

  if (requests.length <= 0) {
    return [];
  }

  const errorCause = { elasticQuery: { index: options.index, body: requests } };

  const { body: { responses } } = await asyncWithCommonHandlers(
    () => elasticMSearch(
      {
        index: options.index,
        body: requests.map((body) => [{}, body]).flat(),
      },
      options.auth.username,
    ),
    errorCause,
  );

  const results = responses.map(
    (response, i) => {
      const figureId = figures[i]._.id;
      const figure = options.figures[figureId];
      const title = figure?.params?.title || figure?.type || (figureId + 1);

      figure.data = handleEsResponse(
        response,
        figure,
        { ...errorCause, figure: title },
      );
      return figure.data;
    },
  );

  return results;
}
