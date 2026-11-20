/**
 * The one error type the API answers with: a refusal that carries everything
 * the page needs to explain itself. Raised by middleware and services, turned
 * into a response by middleware/error-handler.ts.
 */

/** One thing wrong with a request, tied to the form field it concerns (`form` for none). */
export interface Issue {
  field: string;
  message: string;
}

/** HTTP statuses this API uses for a refused request. */
export type RefusalStatus = 400 | 403 | 404 | 413 | 415 | 429;

/** A request the API refuses: a status, a stable code, and the issues to show. */
export class RequestError extends Error {
  constructor(
    readonly status: RefusalStatus,
    readonly code: string,
    readonly issues: readonly Issue[],
  ) {
    super(issues.map((issue) => issue.message).join(' '));
    this.name = 'RequestError';
  }
}

/** A refusal that concerns the request as a whole. */
export const refuse = (status: RefusalStatus, code: string, message: string): RequestError =>
  new RequestError(status, code, [{ field: 'form', message }]);
