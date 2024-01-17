/* eslint-disable import/prefer-default-export */
/**
 * Filters the index based on the query text. Including wildcards.
 *
 * @param item The item to be filtered.
 * @param queryText The query text to filter the item.
 * @return Returns true if the item matches the query text, otherwise false.
 */
export const indexFilter = (item: string, queryText: string) => {
  const w = queryText.replace(/[.+^${}()|[\]\\]/g, '\\$&'); // regexp escape
  const re = new RegExp(
    `^${w.replace(/\*/g, '.*').replace(/\?/g, '.')}`,
  );

  return re.test(item);
};
