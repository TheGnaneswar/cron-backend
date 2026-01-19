/**
 * Custom error classes for better error handling
 */

class ScraperError extends Error {
    constructor(platform, message, originalError = null) {
        super(`[${platform}] ${message}`);
        this.name = 'ScraperError';
        this.platform = platform;
        this.originalError = originalError;
    }
}

class DatabaseError extends Error {
    constructor(operation, message, originalError = null) {
        super(`[DB:${operation}] ${message}`);
        this.name = 'DatabaseError';
        this.operation = operation;
        this.originalError = originalError;
    }
}

class AIError extends Error {
    constructor(provider, message, originalError = null) {
        super(`[AI:${provider}] ${message}`);
        this.name = 'AIError';
        this.provider = provider;
        this.originalError = originalError;
    }
}

class ValidationError extends Error {
    constructor(field, message) {
        super(`[Validation:${field}] ${message}`);
        this.name = 'ValidationError';
        this.field = field;
    }
}

module.exports = {
    ScraperError,
    DatabaseError,
    AIError,
    ValidationError
};
