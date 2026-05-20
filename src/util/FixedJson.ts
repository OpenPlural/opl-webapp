import JSONbig from 'json-bigint';

const configuredJson = JSONbig({alwaysParseAsBig: true, useNativeBigInt: true});

export function fromJson(json: string): any {
  return configuredJson.parse(json);
}
