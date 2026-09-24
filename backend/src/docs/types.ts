import type { OpenAPIV3_1 } from 'openapi-types';

export type SchemaObject = OpenAPIV3_1.SchemaObject;
export type PathsObject = OpenAPIV3_1.PathsObject;

// What each feature's *.docs.ts file exports. openapi.ts merges them all.
export type ApiDocsModule = {
  tag: OpenAPIV3_1.TagObject;
  paths: PathsObject;
  schemas?: Record<string, SchemaObject>;
};

// Shorthand for "$ref to a shared component", e.g. ref.schema('Error').
export const ref = {
  schema: (name: string) => ({ $ref: `#/components/schemas/${name}` }),
  response: (name: string) => ({ $ref: `#/components/responses/${name}` }),
  parameter: (name: string) => ({ $ref: `#/components/parameters/${name}` }),
};
