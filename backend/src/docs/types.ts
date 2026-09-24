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

type ErrorExample = { code: string; message: string; details?: Record<string, string[]> };

// An error response with an endpoint-specific example, for when the shared
// ones in components.responses are too generic (e.g. a particular 409 message).
// Return type is inferred: openapi-types checks path items against its 3.0
// types, which reject an explicit OpenAPIV3_1.ResponseObject.
export function errorResponse(description: string, example: ErrorExample) {
  return {
    description,
    content: { 'application/json': { schema: ref.schema('Error'), example } },
  };
}
