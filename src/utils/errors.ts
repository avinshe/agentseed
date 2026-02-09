export class AgentseedError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "AgentseedError";
  }
}

export class ConfigError extends AgentseedError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}

export class ProviderError extends AgentseedError {
  constructor(message: string, public provider: string) {
    super(message, "PROVIDER_ERROR");
    this.name = "ProviderError";
  }
}

export class AnalysisError extends AgentseedError {
  constructor(message: string) {
    super(message, "ANALYSIS_ERROR");
    this.name = "AnalysisError";
  }
}
