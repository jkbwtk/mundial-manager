import { asc, type SQL, sql } from 'drizzle-orm';
import { type AnyPgColumn, customType } from 'drizzle-orm/pg-core';
import { escapeLikePattern } from '#blib/utils';

export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return 'tsvector';
  },
});

export interface TextSearchColumns {
  vector?: AnyPgColumn;
  text: [AnyPgColumn, ...AnyPgColumn[]];
}

interface SearchTerms {
  phrase: string;
  tokens: string[];
  foldedTokens: string[];
}

const FOLD_FROM =
  'àáâãäåāăąçćčďđèéêëēėęěìíîïīįıľĺłñńňòóôõöøōőŕřśšşßťţùúûüūůűųýÿźżž';
const FOLD_TO =
  'aaaaaaaaacccddeeeeeeeeiiiiiiilllnnnoooooooorrssssttuuuuuuuuyyzzz';
const FUZZY_MIN_LENGTH = 4;
const FUZZY_TYPO_MIN_LENGTH = 5;

const SearchTokenRegex = /[\p{L}\p{N}]+/gu;
const FoldedChars = new Map(
  [...FOLD_FROM].map((char, index) => [char, FOLD_TO[index]!]),
);

function foldText(value: string): string {
  return [...value.toLowerCase()]
    .map((char) => FoldedChars.get(char) ?? char)
    .join('');
}

function foldSql(value: SQL | AnyPgColumn): SQL {
  return sql`translate(lower(coalesce(${value}, '')), ${sql.raw(`'${FOLD_FROM}'`)}, ${sql.raw(`'${FOLD_TO}'`)})`;
}

function getSearchTerms(search: string): SearchTerms {
  const normalized = search.normalize('NFC');
  const tokens = normalized.toLowerCase().match(SearchTokenRegex) ?? [];

  return {
    phrase: foldText(normalized.trim().replace(/\s+/g, ' ')),
    tokens,
    foldedTokens: tokens.map(foldText),
  };
}

function getFuzzyPattern(token: string): string {
  const chars = [...token];
  const variants =
    chars.length >= FUZZY_TYPO_MIN_LENGTH
      ? chars
          .slice(1)
          .map((_char, index) =>
            chars.filter((_other, otherIndex) => otherIndex !== index + 1),
          )
      : [chars];

  return `\\m(?:${variants.map((variant) => variant.join('\\w*')).join('|')})`;
}

function anySql(conditions: SQL[]): SQL {
  if (conditions.length === 0) return sql`false`;

  return sql`(${sql.join(conditions, sql` or `)})`;
}

function allSql(conditions: SQL[]): SQL {
  if (conditions.length === 0) return sql`true`;

  return sql`(${sql.join(conditions, sql` and `)})`;
}

export function createTextSearchSql(columns: TextSearchColumns) {
  const nameColumn = foldSql(columns.text[0]);
  const otherColumns = columns.text.slice(1).map(foldSql);
  const haystack = foldSql(
    sql`concat_ws(' ', ${sql.join(columns.text, sql`, `)})`,
  );

  const getTsQuery = (terms: SearchTerms) =>
    sql`to_tsquery('english', ${terms.tokens.map((token) => `${token}:*`).join(' & ')})`;

  const isTokenContained = (token: string) =>
    sql`${haystack} like ${`%${token}%`}`;

  const isTokenMatched = (token: string) =>
    token.length >= FUZZY_MIN_LENGTH
      ? sql`(${isTokenContained(token)} or ${haystack} ~ ${getFuzzyPattern(token)})`
      : isTokenContained(token);

  return {
    ranking: (search: string): SQL => {
      const terms = getSearchTerms(search);
      const prefix = `${escapeLikePattern(terms.phrase)}%`;

      const tier = sql`case
        when ${anySql([nameColumn, ...otherColumns].map((column) => sql`${column} = ${terms.phrase}`))} then 6
        when ${nameColumn} like ${prefix} then 5
        when ${anySql(otherColumns.map((column) => sql`${column} like ${prefix}`))} then 4
        when ${allSql(terms.foldedTokens.map((token) => sql`${haystack} ~ ${`\\m${token}`}`))} then 3
        when ${allSql(terms.foldedTokens.map(isTokenContained))} then 2
        when ${allSql(terms.foldedTokens.map(isTokenMatched))} then 1
        else 0
      end`;

      if (columns.vector === undefined || terms.tokens.length === 0) {
        return tier;
      }

      return sql`${tier} + ts_rank(${columns.vector}, ${getTsQuery(terms)}, 32)`;
    },
    where: (search: string): SQL => {
      const terms = getSearchTerms(search);
      if (terms.tokens.length === 0) return sql`false`;

      const matches = [allSql(terms.foldedTokens.map(isTokenMatched))];

      if (columns.vector !== undefined) {
        matches.push(sql`${columns.vector} @@ ${getTsQuery(terms)}`);
      }

      return anySql(matches);
    },
    orderBy: [asc(columns.text[0])],
  };
}
