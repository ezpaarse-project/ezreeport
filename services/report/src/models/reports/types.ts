import { Type, Static } from '~/lib/typebox';

export const ReportErrorCause = Type.Object({
  type: Type.Union([
    Type.Literal('fetch'),
    Type.Literal('render'),
    Type.Literal('unknown'),
  ]),
  layout: Type.Integer(),
  figure: Type.Optional(
    Type.Integer(),
  ),
  elasticQuery: Type.Optional(
    Type.Any(),
  ),
  vegaSpec: Type.Optional(
    Type.Any(),
  ),
});

export const ReportResult = Type.Object({
  success: Type.Boolean(),

  detail: Type.Object({
    createdAt: Type.String({ /* format: 'date-time' */ }),

    destroyAt: Type.String({ /* format: 'date-time' */ }),

    took: Type.Integer(),

    taskId: Type.String(),

    files: Type.Object({
      detail: Type.String(),

      report: Type.Optional(
        Type.String(),
      ),

      debug: Type.Optional(
        Type.String(),
      ),
    }),

    sendingTo: Type.Optional(
      Type.Array(
        Type.String({ /* format: 'email' */ }),
      ),
    ),

    period: Type.Optional(
      Type.Object({
        start: Type.String({ /* format: 'date-time' */ }),

        end: Type.String({ /* format: 'date-time' */ }),
      }),
    ),

    auth: Type.Optional(
      Type.Object({
        elastic: Type.Optional(
          Type.Object({
            username: Type.String(),
          }),
        ),
      }),
    ),

    stats: Type.Optional(
      Type.Object({
        pageCount: Type.Integer(),

        size: Type.Integer(),
      }),
    ),

    error: Type.Optional(
      Type.Object({
        message: Type.String(),

        stack: Type.Array(
          Type.String(),
        ),

        cause: ReportErrorCause,
      }),
    ),

    meta: Type.Any(),
  }),
});

export type ReportResultType = Static<typeof ReportResult>;
