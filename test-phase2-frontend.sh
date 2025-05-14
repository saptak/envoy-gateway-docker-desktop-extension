#!/bin/bash

echo "🧪 Running Phase 2 Frontend Tests..."
echo "===================================="

# Navigate to frontend directory
cd /Users/saptak/code/envoy-gateway-docker-desktop-extension/src/frontend

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run TypeScript compilation check
echo "🔍 Running TypeScript compilation check..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed"
    exit 1
fi

echo "✅ TypeScript compilation successful"

# Run ESLint
echo "🔍 Running ESLint..."
npx eslint src --ext .ts,.tsx --max-warnings 0

if [ $? -ne 0 ]; then
    echo "⚠️  ESLint found issues"
fi

# Run tests with coverage
echo "🧪 Running Jest tests with coverage..."
npm run test:coverage

# Check test results
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed"
fi

# Generate test summary
echo ""
echo "📊 Test Summary Report"
echo "======================"

# Count test files
TOTAL_TEST_FILES=$(find __tests__ -name "*.test.ts*" -o -name "*.test.js*" | wc -l)
echo "Test Files: $TOTAL_TEST_FILES"

# Display coverage summary (if available)
if [ -f "coverage/lcov-report/index.html" ]; then
    echo "Coverage Report: Generated at coverage/lcov-report/index.html"
fi

echo ""
echo "📁 Test Structure:"
echo "- Unit Tests: $(find __tests__ -path "*/components/*" -name "*.test.ts*" | wc -l) component tests"
echo "- Service Tests: $(find __tests__ -path "*/services/*" -name "*.test.ts*" | wc -l) service tests"
echo "- Integration Tests: $(find __tests__ -path "*/integration/*" -name "*.test.ts*" | wc -l) integration tests"

echo ""
echo "🏁 Phase 2 Frontend Testing Complete!"
echo "Exit Code: $TEST_EXIT_CODE"

exit $TEST_EXIT_CODE
