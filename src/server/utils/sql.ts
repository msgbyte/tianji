import NodeSqlParser from 'node-sql-parser';

const { Parser } = NodeSqlParser;

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
