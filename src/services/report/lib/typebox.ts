import type { Static, TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

import { ArgumentError } from '~/types/errors';

/**
 * Cached validators
 */
const validators = new Map<bigint, ValidateFunction>();

// Setup ajv (already used by fastify) with formats used by TypeBox
const ajv = addFormats(new Ajv({}), [
  'date-time',
  'time',
  'date',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'uri',
  'uri-reference',
  'uuid',
  'uri-template',
  'json-pointer',
  'relative-json-pointer',
  'regex',
]);

// This function is not an arrow function
// because of a limitation in TS
// see https://github.com/microsoft/TypeScript/issues/34523
/**
 * Assert (validate or throw) given value against given TypeBox
 * schema
 *
 * @param schema The schema
 * @param value The value
 *
 * @example
 * ```ts
 * assertIsSchema(MySuperSchema, myvalue);
 *
 * console.log("myvalue");
 * ```
 */
export function assertIsSchema<T extends TSchema>(
  schema: T,
  value: unknown,
  errorPrefix = 'body',
): asserts value is Static<T> {
  // Keep/Restore validator in cache
  const schemaHash = Value.Hash(schema);
  let validate = validators.get(schemaHash);
  if (!validate) {
    validate = ajv.compile(schema);
    validators.set(schemaHash, validate);
  }

  // If valid, no need to do anything else
  if (validate(value)) {
    return;
  }

  // If not valid, throw error
  const validationError = validate.errors?.at(0);
  if (validationError) {
    throw new ArgumentError(
      `${errorPrefix} ${validationError.message}`,
    );
  }
}

export { Type, type Static } from '@sinclair/typebox';
export { Value } from '@sinclair/typebox/value';
