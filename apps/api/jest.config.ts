import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/__tests__/**/*.jest.test.ts'],
  moduleNameMapper: {
    '^(.*)\\.js$': '$1'
  }
};

export default config;
