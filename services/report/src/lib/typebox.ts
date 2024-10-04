import type { Static, TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

import { ArgumentError } from '~/types/errors';

/**
 * Cached validators
 */
const validators = new Map<bigint, ValidateFunction>();

// Setup ajv (already used by fastify) with custom formats
export const ajv = new Ajv({});
addFormats(ajv, { formats: ['email', 'date', 'iso-date-time'] });

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
      `${errorPrefix}${validationError.instancePath} ${validationError.message}`,
    );
  }
}

export { Type, type Static } from '@sinclair/typebox';
export { Value } from '@sinclair/typebox/value';
