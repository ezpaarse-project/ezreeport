// eslint-disable-next-line import/prefer-default-export
export const query = {
  must: [],
  filter: [
    {
      match_phrase: {
        Metric_Type: 'Total_Item_Requests',
      },
    },
    {
      match_phrase: {
        Access_Type: 'Controlled',
      },
    },
    {
      bool: {
        should: [
          {
            match_phrase: {
              YOP: '2017',
            },
          },
          {
            match_phrase: {
              YOP: '2018',
            },
          },
          {
            match_phrase: {
              YOP: '2019',
            },
          },
          {
            match_phrase: {
              YOP: '2020',
            },
          },
          {
            match_phrase: {
              YOP: '2021',
            },
          },
        ],
        minimum_should_match: 1,
      },
    },
  ],
  should: [],
  must_not: [
    {
      match_phrase: {
        'Report_Header.Report_ID': 'TR',
      },
    },
    {
      match_phrase: {
        Data_Type: 'Journal',
      },
    },
    {
      match_phrase: {
        Section_Type: 'Article',
      },
    },
    {
      match_phrase: {
        Platform: 'ScienceDirect licensed content',
      },
    },
    {
      match_phrase: {
        Title: 'Science of The Total Environment',
      },
    },
    {
      exists: {
        field: 'Item',
      },
    },
  ],
};
