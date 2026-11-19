/** One thing wrong with a request, tied to the form field it concerns. */
export interface Issue {
  /** The request field, which is also the id of its form control. `form` when it is no single field. */
  field: string;
  message: string;
}

/** HTTP statuses this API uses for a refused request. */
export type RefusalStatus = 400 | 403 | 404 | 413 | 415 | 429;

/**
 * A request the API refuses, with everything the page needs to say why: a
 * status, a stable code, and the issues to list in the error summary.
 */
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
