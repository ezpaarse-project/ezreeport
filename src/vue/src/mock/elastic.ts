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

export const omeka = {
  filter: [
    {
      bool: {
        should: [
          {
            match_phrase: {
              ua: 'YandexBot',
            },
          },
          {
            match_phrase: {
              ua: 'Amazonbot',
            },
          },
          {
            match_phrase: {
              ua: 'NE Crawler',
            },
          },
          {
            match_phrase: {
              ua: 'BingPreview',
            },
          },
          {
            match_phrase: {
              ua: 'SeekportBot',
            },
          },
          {
            match_phrase: {
              ua: 'bingbot',
            },
          },
          {
            match_phrase: {
              ua: 'robot',
            },
          },
          {
            match_phrase: {
              ua: 'Googlebot',
            },
          },
          {
            match_phrase: {
              ua: 'CCBot',
            },
          },
          {
            match_phrase: {
              ua: 'Applebot',
            },
          },
          {
            match_phrase: {
              ua: 'SEO Crawler',
            },
          },
          {
            match_phrase: {
              ua: '; bot',
            },
          },
          {
            match_phrase: {
              ua: 'serpstatbot',
            },
          },
          {
            match_phrase: {
              ua: 'Facebook',
            },
          },
          {
            match_phrase: {
              ua: 'PetalBot',
            },
          },
          {
            match_phrase: {
              ua: 'MJ12bot',
            },
          },
          {
            match_phrase: {
              ua: 'SpiderLing',
            },
          },
          {
            match_phrase: {
              ua: 'crawler',
            },
          },
          {
            match_phrase: {
              ua: 'Swiftfox',
            },
          },
          {
            match_phrase: {
              ua: 'SerendeputyBot',
            },
          },
          {
            match_phrase: {
              ua: 'curl',
            },
          },
          {
            match_phrase: {
              ua: 'FacebookBot',
            },
          },
          {
            match_phrase: {
              ua: 'okhttp',
            },
          },
          {
            match_phrase: {
              ua: 'none',
            },
          },
          {
            match_phrase: {
              ua: 'Python Requests',
            },
          },
          {
            match_phrase: {
              ua: 'ytespider',
            },
          },
          {
            match_phrase: {
              ua: 'ClaudeBot',
            },
          },
          {
            match_phrase: {
              ua: 'Qwantify',
            },
          },
          {
            match_phrase: {
              ua: 'ImagesiftBot',
            },
          },
          {
            match_phrase: {
              ua: 'fidget-spinner-bot',
            },
          },
          {
            match_phrase: {
              ua: 'GPTBot',
            },
          },
          {
            match_phrase: {
              ua: 'PhxBot',
            },
          },
          {
            match_phrase: {
              ua: 'claudebot',
            },
          },
          {
            match_phrase: {
              ua: 'trendictionbot0',
            },
          },
          {
            match_phrase: {
              ua: 'Nutch',
            },
          },
        ],
      },
    },
    {
      bool: {
        should: [
          {
            match_phrase: {
              'user-agent': 'Turnitin (https://bit.ly/2UvnfoQ)',
            },
          },
          {
            match_phrase: {
              'user-agent': 'Turnitin (https://bit.ly/2UvnfoQ)',
            },
          },
          {
            match_phrase: {
              'user-agent': 'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)',
            },
          },
          {
            match_phrase: {
              'user-agent': 'Mozilla/5.0 (compatible; BLEXBot/1.0; +http://webmeup-crawler.com/)',
            },
          },
          {
            match_phrase: {
              'user-agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
            },
          },
          {
            match_phrase: {
              'user-agent': 'NutchUL/Nutch-2.3.1',
            },
          },
          {
            match_phrase: {
              'user-agent': 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
            },
          },
          {
            match_phrase: {
              'user-agent': 'Mozilla/5.0 (compatible; bnf.fr_bot; +https://www.bnf.fr/fr/capture-de-votre-site-web-par-le-robot-de-la-bnf)',
            },
          },
          {
            match_phrase: {
              'user-agent': 'Mozilla/5.0 (compatible; DataForSeoBot/1.0; +https://dataforseo.com/dataforseo-bot)',
            },
          },
          {
            match_phrase: {
              'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            },
          },
          {
            match_phrase: {
              'user-agent': 'Mozilla/5.0 (compatible; DotBot/1.2; +https://opensiteexplorer.org/dotbot; help@moz.com)',
            },
          },
        ],
      },
    },
  ],
  must_not: [],
};
