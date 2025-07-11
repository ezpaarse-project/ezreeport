import { parseISO } from 'date-fns';

interface RawCreatedObject {
  createdAt: string;
}

type CreatedObject<Raw> = Omit<Raw, 'createdAt'> & {
  createdAt: Date;
};

/**
 * Transform an object with `createdAt` as a string, to an object with `createdAt` as a Date
 *
 * @param raw Original object
 *
 * @returns Copy of object
 */
export const transformCreated = <
  Raw extends RawCreatedObject = RawCreatedObject,
>(
  raw: Raw
): CreatedObject<Raw> => ({
  ...raw,
  createdAt: parseISO(raw.createdAt),
});

interface RawUpdatedObject {
  updatedAt?: string | null;
}

type UpdatedObject<Raw> = Omit<Raw, 'updatedAt'> & {
  updatedAt?: Date;
};

/**
 * Transform an object with `updatedAt` as a string, to an object with `updatedAt` as a Date
 *
 * @param raw Original object
 *
 * @returns Copy of object
 */
export const transformUpdated = <
  Raw extends RawUpdatedObject = RawUpdatedObject,
>(
  raw: Raw
): UpdatedObject<Raw> => ({
  ...raw,
  updatedAt: raw.updatedAt ? parseISO(raw.updatedAt) : undefined,
});

type RawCreatedUpdatedObject = RawCreatedObject & RawUpdatedObject;

type CreatedUpdatedObject<Raw> = CreatedObject<Raw> & UpdatedObject<Raw>;

/**
 * Transform an object with `createdAt` & `updatedAt` as a string,
 * to an object with `createdAt` & `updatedAt` as a Date
 *
 * @param raw Original object
 *
 * @returns Copy of object
 */
export const transformCreatedUpdated = <Raw extends RawCreatedUpdatedObject>(
  raw: Raw
): CreatedUpdatedObject<Raw> => {
  const created = transformCreated(raw);
  const updated = transformUpdated(raw);
  return { ...raw, createdAt: created.createdAt, updatedAt: updated.updatedAt };
};
