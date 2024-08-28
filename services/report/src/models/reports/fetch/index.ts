import type { estypes as ElasticTypes } from '@elastic/elasticsearch';

import { Recurrence } from '~/lib/prisma';
import { Type, Static } from '~/lib/typebox';
import { asyncWithCommonHandlers } from '~/lib/utils';
import { elasticMSearch } from '~/lib/elastic';

import { Figure, type FigureType } from '~/models/figures';
import { calcElasticInterval } from '~/models/recurrence';

import { prepareEsQuery, Filter } from './filters';
import prepareEsAggregations from './aggs';
import handleEsResponse from './results';

const ElasticFetchOptions = Type.Object({
  recurrence: Type.Enum(Recurrence),
  period: Type.Object({
    start: Type.Integer(),
    end: Type.Integer(),
  }),
  auth: Type.Object({
    username: Type.String({ minLength: 1 }),
  }),
  dateField: Type.String({ minLength: 1 }),
  index: Type.Optional(Type.String({ minLength: 1 })),
  filters: Type.Optional(
    Type.Array(Filter),
  ),
  figures: Type.Array(Figure),
});

export type ElasticFetchOptionsType = Static<typeof ElasticFetchOptions>;

type FigureWithId = FigureType & { _: { id: number } };

export async function fetchElastic(options: ElasticFetchOptionsType) {
  if (!options.index) {
    throw new Error('Missing index');
  }

  const calendarInterval = calcElasticInterval(options.recurrence);

  const figures = options.figures
    .map((f, i): FigureWithId => ({ ...f, _: { id: i } }))
    .filter((f) => f.type !== 'md');

  const requests: ElasticTypes.MsearchMultisearchBody[] = figures.map((f) => {
    const query = prepareEsQuery(
      [options.filters, f.filters].filter((x) => !!x).flat(), // Merge filters
      options.dateField,
      options.period,
    );

    // TODO: add cause in error

    const aggregations = prepareEsAggregations(f, options.dateField, calendarInterval);

    return {
      query,
      aggregations,
      size: 0,
    };
  });

  const errorCause = { elasticQuery: { index: options.index, body: requests } };

  const { body: { responses } } = await asyncWithCommonHandlers(
    () => elasticMSearch(
      {
        index: options.index,
        body: requests.map((body) => [{}, body]).flat(),
      },
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
