export default {
    testMatch: ['<rootDir>/**/*.test.js'],
    testEnvironment: 'node',
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/pairtest/TicketService.js'],
    coverageReporters: ['text-summary', 'json-summary', 'html'],
    coverageDirectory: './coverage',
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    transform: {}
}
