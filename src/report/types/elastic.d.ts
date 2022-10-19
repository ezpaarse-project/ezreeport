type ElasticUser = {
  'username': string,
  'roles': string[],
  'full_name': string,
  'email': string,
  'metadata': Record<string, any>,
  'enabled': boolean
};
