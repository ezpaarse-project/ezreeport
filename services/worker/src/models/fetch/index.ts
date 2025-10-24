import type { estypes as ElasticTypes } from '@elastic/elasticsearch';

import type { RecurrenceType } from '@ezreeport/models/recurrence';
import type { FigureType, FilterType } from '@ezreeport/models/templates';
import type { ReportPeriodType } from '@ezreeport/models/reports';

import { elasticMSearch } from '~/lib/elastic';

import { calcElasticIntervalFromRecurrence } from '~/models/recurrence';
import TemplateError from '~/models/generation/errors';
import TypedError from '~/models/errors';

import FetchError from './errors';
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

// oxlint-disable-next-line id-length
type FigureWithId = FigureType & { _: { id: number } };

/**
 * Fetch data from Elastic for the given figures
 *
 * @param options Options to fetch data
 *
 * @returns The data
 */
export async function fetchElastic(options: ElasticFetchOptionsType) {
  if (!options.index) {
    throw new TemplateError('No index provided', 'MissingIndexError');
  }

  const calendarInterval = calcElasticIntervalFromRecurrence(
    options.recurrence
  );

  const figures = options.figures
    // oxlint-disable-next-line id-length
    .map((fig, index): FigureWithId => ({ ...fig, _: { id: index } }))
    .filter((fig) => fig.type !== 'md');

  const requests: ElasticTypes.MsearchMultisearchBody[] = figures.map((fig) => {
    const query = prepareEsQuery(
      [options.filters, fig.filters].filter((filter) => !!filter).flat(), // Merge filters
      { value: options.period, dateField: options.dateField }
    );

    const aggregations = prepareEsAggregations(
      fig,
      options.dateField,
      calendarInterval
    );

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

  const responses = await elasticMSearch(
    {
      index: options.index,
      body: requests.flatMap((request) => [{}, request]),
    },
    options.auth.username
  )
    .then(({ body }) => body.responses)
    .catch(
      (err) =>
        new FetchError(
          err instanceof Error ? err.message : `${err}`,
          'UnknownError',
          { esIndex: options.index, esQuery: requests }
        )
    );

  if (responses instanceof Error) {
    throw responses;
  }

  const results = responses.map((response, index) => {
    const figureId = figures[index]._.id;
    const figure = options.figures[figureId];

    try {
      figure.data = handleEsResponse(response, figure);
    } catch (error) {
      const cause = {
        esIndex: options.index,
        esQuery: requests[index],
        figure: figureId,
      };

      if (error instanceof TypedError) {
        error.cause = cause;
        throw error;
      }

      throw new FetchError(
        error instanceof Error ? error.message : `${error}`,
        'ElasticError',
        cause
      );
    }

    return figure.data;
  });

  return results;
}
