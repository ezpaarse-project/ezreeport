type ElasticUser = {
  'username': string,
  'roles': string[],
  'full_name': string,
  'email': string,
  'metadata': Record<string, any>,
  'enabled': boolean
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
