export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export class ServerConfigurationError extends ApiError {
  constructor() {
    super(503, "service_unavailable", "Cloud plans are not configured yet.");
    this.name = "ServerConfigurationError";
  }
}
