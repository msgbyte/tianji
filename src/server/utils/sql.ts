import { Prisma } from '@prisma/client';
import NodeSqlParser from 'node-sql-parser';

const { Parser } = NodeSqlParser;

const quotedIdentifierPathRegex =
  /^"[A-Za-z_][A-Za-z0-9_]*"(\."[A-Za-z_][A-Za-z0-9_]*")*$/;

export function quoteSqlIdentifierText(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export function quoteSqlIdentifier(identifier: string) {
  return Prisma.raw(quoteSqlIdentifierText(identifier));
}

export function quoteSqlIdentifierPath(...parts: string[]) {
  if (parts.length === 0) {
    throw new Error('SQL identifier path must contain at least one part');
  }

  return Prisma.raw(parts.map(quoteSqlIdentifierText).join('.'));
}

export function assertQuotedSqlIdentifierPath(path: string) {
  if (!quotedIdentifierPathRegex.test(path)) {
    throw new Error('Invalid SQL identifier path');
  }

  return path;
}

interface ValidateSqlIsQueryOptions {
  database: 'MySQL' | 'Postgresql';
  type: 'table' | 'column';
}

export function validateSqlIsQuery(sql: string) {
  if (
    sql.toLowerCase().includes('call') ||
    sql.toLowerCase().includes('database') // corner corner case
  ) {
    return false;
  }

  function check(_sql: string, _options: ValidateSqlIsQueryOptions) {
    const parser = new Parser();
    const whiteColumnList = ['select::(.*)::(.*)'];

    try {
      const error = parser.whiteListCheck(_sql, whiteColumnList, {
        ..._options,
        type: 'table',
      });

      return !Boolean(error);
    } catch (err) {
      return false;
    }
  }

  return (
    check(sql, { database: 'MySQL', type: 'table' }) &&
    check(sql, { database: 'MySQL', type: 'column' }) &&
    check(sql, { database: 'Postgresql', type: 'table' }) &&
    check(sql, { database: 'Postgresql', type: 'column' })
  );
}
