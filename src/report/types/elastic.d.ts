type ElasticUser = {
  username: string,
  roles: string[],
  full_name: string,
  email: string,
  metadata: Record<string, unknown>,
  enabled: boolean
};

type ElasticInstitution = {
  id: string;
  indexPrefix: string;
  indexCount: number;
  role: string;
  space: string;
  name: string;
  city: string;
  website: string;
  auto: {
    ezmesure: boolean;
    ezpaarse: boolean;
    report: boolean;
    sushi: boolean;
  };
  validated: boolean;
  domains: any[];
  logoId: string;
  updatedAt: Date;
  createdAt: Date;
  acronym: string;
  type: string;
  twitterUrl: string;
  youtubeUrl: string;
  docContactName: string;
  techContactName: string;
  hidePartner: boolean;
  sushiReadySince: Date;
};

type ElasticConsultation = {
  datetime: Date;
  date: string;
  login: string;
  platform: string;
  platform_name: string;
  publisher_name: string;
  rtype: string;
  mime: string;
  print_identifier: string;
  title_id: string;
  doi: string;
  publication_title: string;
  publication_date: string;
  unitid: string;
  domain: string;
  on_campus: string;
  log_id: string;
  ezpaarse_version: string;
  ezpaarse_date: string;
  middlewares_version: string;
  middlewares_date: string;
  platforms_version: string;
  platforms_date: string;
  middlewares: string;
  'bib-groups': string;
  title: string;
  type: string;
  subject: string;
  'geoip-country': string;
  'geoip-latitude': string;
  'geoip-longitude': string;
  user: string;
  section: string;
  department: string;
  unit: string;
  portal: string;
  host: string;
  'ezproxy-session': string;
  url: string;
  status: string;
  size: string;
  index_name: string;
  location: {
    lat: number;
    lon: number;
  };
};
