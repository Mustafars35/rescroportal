declare module "@neondatabase/serverless" {
  type QueryResult = Record<string, unknown>[];
  type Sql = {
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<QueryResult>;
    transaction(queries: Promise<QueryResult>[]): Promise<QueryResult[]>;
  };
  export function neon(connectionString: string): Sql;
}
