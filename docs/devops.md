# TaskFlow DevOps & CI Documentation

## Continuous Integration

**CI is implemented. CD/deployment is not yet configured.**

---

## GitHub Actions Backend Quality Pipeline

**Workflow file:** [`.github/workflows/backend-ci.yml`](../.github/workflows/backend-ci.yml)

### Triggers

| Event | Branch | Path Filter |
|:---|:---|:---|
| `push` | `main` | `backend/**` or `.github/workflows/backend-ci.yml` |
| `pull_request` | `main` | `backend/**` or `.github/workflows/backend-ci.yml` |

Path filtering ensures the pipeline only runs when backend files change.

### Infrastructure

The job runs on `ubuntu-latest` and spins up a MongoDB 7.0 service container:

```yaml
services:
  mongodb:
    image: mongo:7.0
    ports: [27017:27017]
    options: --health-cmd "mongosh --eval 'db.runCommand({ ping: 1 })'"
```

The job waits for MongoDB to pass its health check before executing any steps.

### Environment

```
NODE_ENV=test
PORT=5001
MONGO_URI_TEST=mongodb://127.0.0.1:27017/taskflow_test
JWT_SECRET=ci_test_jwt_secret_key_abcdef123456   ← dummy test-only value
```

No real production credentials are used in CI.

### Pipeline Steps

| Step | Command | Fails Pipeline If |
|:---|:---|:---|
| Checkout repository | `actions/checkout@v4` | — |
| Set up Node.js 20 with npm cache | `actions/setup-node@v4` | — |
| Clean install dependencies | `npm ci` | Lock file or install errors |
| Static Analysis (ESLint) | `npm run lint` | Any error **or** warning (`--max-warnings=0`) |
| Unit tests | `npm run test:unit` | Any test fails |
| Integration tests | `npm run test:integration` | Any test fails |
| System / realtime tests | `npm run test:system` | Any test fails |
| Coverage + quality gate | `npm run test:coverage` | Coverage drops below thresholds |
| Upload coverage artifact | `actions/upload-artifact@v4` | — (runs even if earlier steps fail) |

### Coverage Quality Gate Thresholds

Defined in `backend/jest.config.js`:

| Metric | Minimum |
|:---|:---:|
| Statements | 70% |
| Branches | 60% |
| Functions | 85% |
| Lines | 70% |

If any threshold is breached, `npm run test:coverage` exits with a non-zero code and the workflow fails.

### Coverage Artifact

The HTML/LCOV coverage report is uploaded as `backend-coverage-report` with a 14-day retention window. It is available for download from the GitHub Actions run page without requiring a separate deployment.

---

## Local Quality Pipeline

Run the same pipeline locally before pushing:

```bash
cd backend
npm run lint               # Static analysis
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests (requires MONGO_URI_TEST)
npm run test:system        # System + realtime tests
npm run test:coverage      # Full suite + coverage gate
```

---

## Static Analysis

ESLint is configured in `backend/eslint.config.js` using the ESLint v9 flat config format:
- Environment: Node.js CommonJS
- Globals: `jest` test globals recognized in test directories
- Rules: `@eslint/js` recommended set
- Enforcement: `--max-warnings=0` — any warning is a failure

---

## NPM Scripts Reference

From `backend/package.json`:

| Script | Command |
|:---|:---|
| `dev` | `nodemon src/server.js` |
| `test` | `jest --runInBand` |
| `test:unit` | `jest tests/unit --runInBand` |
| `test:integration` | `jest tests/integration --runInBand` |
| `test:system` | `jest tests/system --runInBand` |
| `test:coverage` | `jest --coverage --runInBand` |
| `lint` | `eslint src tests --max-warnings=0` |
| `lint:src` | `eslint src --max-warnings=0` |
| `lint:tests` | `eslint tests --max-warnings=0` |

---

## Deployment

**Deployment is not yet configured.**

No staging or production deployment pipeline exists at this stage. The backend has been developed and tested locally. When deployment is implemented, it will be documented here.
