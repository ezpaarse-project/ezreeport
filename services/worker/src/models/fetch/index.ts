import type { estypes as ElasticTypes } from '@elastic/elasticsearch';

import type { RecurrenceType } from '@ezreeport/models/recurrence';
import type { ReportPeriodType } from '@ezreeport/models/reports';
import type { FigureType, FilterType } from '@ezreeport/models/templates';

import { elasticMSearch } from '~/lib/elastic';

import TypedError from '~/models/errors';
import TemplateError from '~/models/generation/errors';
import { calcElasticIntervalFromRecurrence } from '~/models/recurrence';

import { prepareEsAggregations } from './aggs';
import FetchError from './errors';
import { prepareEsQuery } from './filters';
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

function prepareRequestsOfFigures(
  options: ElasticFetchOptionsType,
  figure: FigureWithId,
  calendarInterval: 'hour' | 'day' | 'month'
): ElasticTypes.MsearchMultisearchBody {
  const query = prepareEsQuery(
    // Merge filters
    // oxlint-disable-next-line no-implicit-coercion - TS Guard
    [options.filters, figure.filters].filter((filter) => !!filter).flat(),
    { dateField: options.dateField, value: options.period }
  );

  const aggregations = prepareEsAggregations(
    figure,
    options.dateField,
    calendarInterval
  );

  return {
    aggregations,
    query,
    size: 0,
    track_total_hits: true,
  };
}

/**
 * Fetch data from Elastic for the given figures
 *
 * @param options Options to fetch data
 *
 * @returns The data
 */
export async function fetchElastic(
  options: ElasticFetchOptionsType
): Promise<void> {
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

  if (figures.length <= 0) {
    return;
  }

  const requests: ElasticTypes.MsearchMultisearchBody[] = figures.map((fig) =>
    prepareRequestsOfFigures(options, fig, calendarInterval)
  );

  const responses = await elasticMSearch(
    {
      body: requests.flatMap((request) => [{}, request]),
      index: options.index,
    },
    options.auth.username
  )
    .then(({ body }) => body.responses)
    .catch(
      (error) =>
        new FetchError(
          error instanceof Error ? error.message : `${error}`,
          'UnknownError',
          { esIndex: options.index, esQuery: requests }
        )
    );

  if (responses instanceof Error) {
    throw responses;
  }

  for (let index = 0; index < responses.length; index += 1) {
    const figureId = figures[index]._.id;
    const figure = options.figures[figureId];

    try {
      figure.data = handleEsResponse(responses[index], figure);
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
  }
}
