export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'ConfigurationError';
  }
}

export class EnvironmentConfigurationError extends ConfigurationError {
  constructor(message: string) {
    super(message);

    this.name = 'EnvironmentConfigurationError';
  }
}

export class ConfigurationAssertionError extends ConfigurationError {
  constructor(message: string) {
    super(message);

    this.name = 'ConfigurationAssertionError';
  }
}
