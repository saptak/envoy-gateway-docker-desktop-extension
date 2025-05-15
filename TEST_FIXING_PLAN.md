# Test Fixing Plan for Envoy Gateway Docker Desktop Extension

## Current Test Status
- **Backend Tests**: 9/10 passing (123/124 tests pass)
- **Frontend Tests**: 2/8 passing (10/124 tests pass)
- **Total**: 11/18 suites passing

## Issues Analysis & Fixes Required

### 1. Backend Issues (1 failure)

#### Middleware Test Failure
**Issue**: `tests/unit/middleware.test.ts` - res.json mock not working correctly
**Root Cause**: originalJson is not properly spied on
**Fix**: Update the mock implementation to properly spy on res.json

### 2. Frontend Issues (6 failures)

#### A. Missing Service Files
**Files needed**:
- `src/frontend/services/api.ts`
- `src/frontend/services/websocket.ts`

#### B. Missing Components  
**Files needed**:
- `src/frontend/components/common/MetricCard.tsx`
- `src/frontend/components/common/StatusBadge.tsx`

#### C. TypeScript Syntax Errors
**File**: `src/frontend/__tests__/hooks/useApi.test.ts`
**Issue**: Incorrect JSX syntax in TypeScript
**Fix**: Replace JSX syntax issues

#### D. Import Path Issues
**Fix**: Update import paths to match actual file structure

## Implementation Plan

### Phase 1: Fix Backend Test (Priority: High)
1. Fix middleware.test.ts mock implementation

### Phase 2: Create Missing Frontend Files (Priority: High)
1. Create API service implementation
2. Create WebSocket service implementation  
3. Create missing components (MetricCard, StatusBadge)

### Phase 3: Fix Frontend Test Issues (Priority: Medium)
1. Fix TypeScript syntax errors in useApi.test.ts
2. Update import paths in test files
3. Ensure all mocks are properly configured

### Phase 4: Verification (Priority: High)
1. Run all tests to verify fixes
2. Generate test coverage report
3. Package Docker Desktop Extension if all tests pass

## Expected Outcome
- **Target**: 100% test suites passing
- **Backend**: 10/10 suites passing
- **Frontend**: 8/8 suites passing  
- **Ready for packaging**: ✅

## Next Steps
1. Execute fixes in order of priority
2. Run tests after each phase
3. Document any remaining issues
4. Proceed with Docker packaging once tests pass
