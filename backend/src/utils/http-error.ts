// Throw this from any layer to send a specific HTTP status to the client.
// The error middleware turns it into a JSON response.
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
