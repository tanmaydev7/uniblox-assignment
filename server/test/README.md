# Test Suite

Integration tests for the server API following best practices.

## Structure

```
test/
├── bootstrap.ts          # Test database setup and cleanup
├── helpers/
│   └── testHelpers.ts   # Helper functions for creating test data
└── integration/
    ├── products.test.ts  # Product API tests
    ├── cart.test.ts     # Cart API tests
    ├── checkout.test.ts  # Checkout API tests
    ├── discounts.test.ts # Discount API tests
    └── admin.test.ts     # Admin API tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Database

Tests use a separate test database (`test.db`) that is automatically created and cleaned up. The test database is isolated from the production database.

## Test Organization

Tests are organized by feature/endpoint:
- Each test file focuses on a specific API endpoint
- Tests are grouped by HTTP method and functionality
- Helper functions reduce code duplication
- Database is cleaned after each test for isolation


