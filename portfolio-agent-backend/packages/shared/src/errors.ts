export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class ExternalProviderError extends AppError {
  constructor(message: string, provider: string, details?: Record<string, unknown>) {
    super(message, "EXTERNAL_PROVIDER_ERROR", 502, { provider, ...details });
    this.name = "ExternalProviderError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, retryAfter?: number) {
    super(message, "RATE_LIMIT_ERROR", 429, { retryAfter });
    this.name = "RateLimitError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "DATABASE_ERROR", 500, details);
    this.name = "DatabaseError";
  }
}

export class LLMError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "LLM_ERROR", 502, details);
    this.name = "LLMError";
  }
}

export class NotificationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "NOTIFICATION_ERROR", 502, details);
    this.name = "NotificationError";
  }
}

export class SignalRejectedError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "SIGNAL_REJECTED", 422, details);
    this.name = "SignalRejectedError";
  }
}

export class SystemConfigurationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "SYSTEM_CONFIGURATION_ERROR", 500, details);
    this.name = "SystemConfigurationError";
  }
}
