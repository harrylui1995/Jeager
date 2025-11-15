<!--
  SYNC IMPACT REPORT
  ==================
  Version Change: [none] → 1.0.0
  Date: 2025-11-15

  Modified Principles:
  - NEW: I. Code Quality Standards
  - NEW: II. Testing Discipline (NON-NEGOTIABLE)
  - NEW: III. User Experience Consistency
  - NEW: IV. Performance Requirements
  - NEW: V. Documentation & Maintainability

  Added Sections:
  - Quality Gates
  - Review Process
  - Governance

  Removed Sections:
  - None (initial version)

  Templates Status:
  ✅ plan-template.md - Constitution Check section already references this file
  ✅ spec-template.md - User scenarios and requirements align with UX and testing principles
  ✅ tasks-template.md - Test-first approach and task structure align with testing discipline

  Follow-up TODOs:
  - None - all placeholders filled

  Rationale:
  - MINOR version 1.0.0: Initial constitution establishing core principles for code quality,
    testing standards, user experience consistency, and performance requirements.
-->

# Jeager Constitution

## Core Principles

### I. Code Quality Standards

**Every contribution MUST meet baseline quality standards before merge.**

**Rules:**
- Code MUST be self-documenting with clear naming conventions
- Functions MUST have single responsibilities (SRP - Single Responsibility Principle)
- Complexity metrics MUST be justified; cyclomatic complexity >10 requires documented rationale
- Code duplication >3 occurrences MUST be refactored into reusable components
- All public APIs MUST include inline documentation (JSDoc, docstrings, etc.)
- MUST follow established linting and formatting standards (automated checks required)
- Security vulnerabilities (OWASP Top 10) MUST be addressed before merge

**Rationale:** Code is read far more often than written. Maintainability directly impacts velocity, bug rates, and team onboarding. Quality standards prevent technical debt accumulation and ensure long-term project health.

### II. Testing Discipline (NON-NEGOTIABLE)

**Test-Driven Development (TDD) is mandatory for all feature work.**

**Rules:**
- Tests MUST be written BEFORE implementation (Red-Green-Refactor cycle)
- Tests MUST fail initially to validate they're testing the right behavior
- Every user story MUST have acceptance tests that verify end-to-end scenarios
- Contract tests REQUIRED for all API endpoints and public interfaces
- Integration tests REQUIRED for:
  - Inter-service communication
  - Database interactions
  - Third-party service integrations
  - Shared schema changes
- Minimum code coverage: 80% for new features, 60% for legacy code modifications
- Tests MUST run in CI/CD pipeline; failing tests block merges
- Flaky tests (>5% failure rate) MUST be fixed or quarantined within 48 hours

**Rationale:** TDD prevents regressions, validates requirements understanding, and serves as living documentation. Tests written after implementation often miss edge cases and don't verify the right behavior. Non-negotiable status prevents shortcuts under pressure.

### III. User Experience Consistency

**User interactions MUST follow consistent patterns and deliver predictable experiences.**

**Rules:**
- All user journeys MUST be documented with acceptance scenarios (Given-When-Then)
- UI/UX patterns MUST be reused across similar workflows (component libraries required)
- Error messages MUST be actionable, user-friendly, and consistent in tone
- Loading states MUST provide feedback for operations >200ms
- Accessibility standards (WCAG 2.1 Level AA minimum) MUST be met for all user interfaces
- User stories MUST be independently testable and deliverable as MVPs
- Breaking changes to user workflows MUST include migration guides and deprecation warnings
- Design reviews REQUIRED for new user-facing features before implementation

**Rationale:** Consistency reduces cognitive load, improves learnability, and builds user trust. Accessible design expands market reach and ensures legal compliance. Independent user stories enable incremental delivery and faster feedback cycles.

### IV. Performance Requirements

**System performance MUST meet defined SLOs (Service Level Objectives) under realistic load.**

**Rules:**
- Performance budgets MUST be defined per feature/endpoint:
  - API response times: p95 <200ms, p99 <500ms
  - Page load times: First Contentful Paint <1.5s, Time to Interactive <3.5s
  - Database queries: <100ms for reads, <500ms for writes
- Load testing REQUIRED before deploying features handling >1000 requests/day
- Memory usage MUST be profiled; memory leaks MUST be resolved before merge
- Bundle sizes MUST be monitored; frontend bundles >500KB require justification
- Database queries MUST be optimized (use of indexes verified, N+1 queries prohibited)
- Caching strategies REQUIRED for frequently accessed data (>100 requests/minute)
- Performance regressions >10% trigger automatic rollback and investigation

**Rationale:** Performance directly impacts user satisfaction, conversion rates, and operational costs. Proactive performance budgets prevent degradation through incremental changes. Realistic load testing prevents production surprises.

### V. Documentation & Maintainability

**Code and architecture MUST be documented to enable autonomous contribution.**

**Rules:**
- README.md MUST include: purpose, setup instructions, common workflows, troubleshooting
- Architecture Decision Records (ADRs) REQUIRED for significant design choices
- API documentation MUST be auto-generated from code and kept in sync
- Runbooks REQUIRED for operational procedures (deployment, rollback, monitoring)
- Breaking changes MUST be documented in CHANGELOG.md with migration guides
- Code comments MUST explain "why," not "what" (code should be self-explanatory)
- Onboarding documentation MUST enable new contributors to make first PR within 4 hours

**Rationale:** Documentation enables scaling teams, reduces bus factor, and accelerates onboarding. Maintainability determines long-term project viability and reduces operational burden.

## Quality Gates

**The following gates MUST pass before any feature is considered complete:**

1. **Constitution Compliance Check**: All principles verified (documented in plan.md)
2. **Test Coverage Gate**: Minimum coverage thresholds met, all tests passing
3. **Code Review Approval**: Minimum 1 approving review from code owner
4. **Performance Validation**: Performance budgets met, load tests passed (if applicable)
5. **Security Scan**: No high/critical vulnerabilities in dependencies or code
6. **Documentation Complete**: README, API docs, and relevant ADRs updated
7. **Accessibility Audit**: WCAG 2.1 Level AA compliance verified (for UI changes)

**Complexity Justification**: Any principle violation MUST be documented with:
- What simpler alternative was considered
- Why the simpler approach is insufficient
- Mitigation plan for introduced complexity

## Review Process

**All code changes MUST go through structured review before merge.**

**Process:**
1. **Self-Review**: Author reviews own changes against checklist (see plan-template.md)
2. **Automated Checks**: Linting, tests, security scans, performance benchmarks run in CI
3. **Peer Review**: At least 1 code owner approval required
4. **Constitution Verification**: Reviewer confirms all applicable principles followed
5. **User Acceptance**: For user-facing changes, product owner validates acceptance criteria

**Review Criteria:**
- Code follows quality standards (Principle I)
- Tests written first and provide adequate coverage (Principle II)
- User experience patterns consistent (Principle III)
- Performance budgets met (Principle IV)
- Documentation updated (Principle V)

**Review Timeline:**
- First review within 24 hours of PR submission
- Critical fixes: 4-hour SLA for review turnaround
- Reviewers MUST provide actionable feedback or approve; "looks good" insufficient

## Governance

**This constitution supersedes all other development practices and guidelines.**

**Amendment Process:**
1. Proposed amendments MUST be documented with rationale and impact analysis
2. Team consensus required (75% approval threshold)
3. Migration plan REQUIRED for amendments affecting existing code
4. Constitution version MUST be incremented following semantic versioning
5. All dependent templates (.specify/templates/) MUST be updated for consistency

**Compliance:**
- All PRs MUST verify constitution compliance via automated checks where possible
- Manual constitution verification required in code review checklist
- Violations MUST be justified in Complexity Tracking section of plan.md
- Repeated violations trigger architectural review and remediation plan

**Versioning Policy:**
- **MAJOR**: Backward-incompatible principle removals or fundamental redefinitions
- **MINOR**: New principles added or existing principles materially expanded
- **PATCH**: Clarifications, wording improvements, typo fixes

**Runtime Guidance:**
- Active development guidance provided via agent-specific files when needed
- This constitution remains technology-agnostic and long-term stable
- Implementation details belong in plan.md, spec.md, and tasks.md

**Version**: 1.0.0 | **Ratified**: 2025-11-15 | **Last Amended**: 2025-11-15
