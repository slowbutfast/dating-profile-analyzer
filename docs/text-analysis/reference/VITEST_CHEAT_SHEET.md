# Vitest Quick Commands

## Backend Tests

```bash
cd backend

# Run all tests once
npm test

# Run tests in watch mode (rerun on changes)
npm test -- --watch

# Run specific test file
npm test -- textAnalysis.spec.ts

# Run tests matching pattern
npm test -- --grep "validation"

# Open interactive UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Frontend Tests

```bash
cd frontend

# Run all tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Open interactive UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Writing New Tests

### Basic Structure
```typescript
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle errors', () => {
    expect(() => badFunction()).toThrow();
  });
});
```

### Common Assertions
```typescript
// Equality
expect(value).toBe(5);                    // ===
expect(value).toEqual({ a: 1 });         // deep equality
expect(value).toStrictEqual({ a: 1 });   // exact match

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThanOrEqual(5);

// Strings
expect(value).toContain('substring');
expect(value).toMatch(/regex/);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain('item');

// Errors
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('error message');
```

## Legacy Console-Based Tests

Still available with ts-node (quick debugging):
```bash
cd backend
npx ts-node tests/textAnalysis.test.ts
npx ts-node tests/mockLLM.test.ts
```

## Debug a Failing Test

```bash
# Run just one test file
npm test -- textAnalysis.spec.ts

# Run tests matching a specific string
npm test -- --grep "should reject"

# Use --inspect for debugging
npm test -- --inspect-brk
```

## Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# Open the report
open coverage/index.html
```

Look for:
- Line coverage: How many lines executed
- Branch coverage: How many if/else paths tested
- Function coverage: How many functions called

## CI/CD Integration

For GitHub Actions or other CI systems:
```bash
npm test -- --run          # Exit after tests complete
npm run test:coverage      # Generate coverage files
```

## Tips

- **Watch mode** is great for development: `npm test -- --watch`
- **UI dashboard** helps visualize tests: `npm run test:ui`
- **Write tests as you code** rather than after
- **Keep tests focused** — one behavior per test
- **Use descriptive test names** — they're documentation
