# AGENTS.md

Guidelines for AI agents working in this repository.

## Project Overview


Anime search application with React + TypeScript frontend and Convex backend.

- **Frontend**: React 19, TypeScript 5.9, Vite 7, React Router 7
- **Backend**: Convex (serverless database with queries/mutations)
- **Data**: Python scripts for importing anime data from SQLite to Convex

## Build Commands
DO NOT RUN THE SERVERS ON OWN, JUST BUILD THEM

```bash
# Development server
npm run dev

# Production build (runs TypeScript compiler then Vite build)
npm run build

# Preview production build
npm run preview

# Type checking only
npx tsc --noEmit
```

## Testing

No test framework currently configured. To add tests:
- Install a test runner (Vitest, Jest, or Playwright for E2E)
- Add test scripts to package.json

## Code Style Guidelines

### TypeScript/React

- **Quotes**: Use double quotes for strings
- **Indentation**: 2 spaces
- **Semicolons**: Required
- **Imports**: Group React imports first, then libraries, then local imports
- **Components**: Use PascalCase for component names (e.g., `AnimeDetail`)
- **Functions**: Use camelCase (e.g., `handleSearch`, `useQuery`)
- **Types**: Define interfaces for props; use TypeScript's strict mode

### File Organization

```
src/
  components/     # Reusable UI components
  pages/          # Route-level page components
  hooks/          # Custom React hooks
  main.tsx        # App entry point
  App.tsx         # Root component

convex/
  schema.ts       # Database schema definitions
  anime.ts        # Queries and mutations
  http.ts         # HTTP route definitions
  httpActions.ts  # HTTP action handlers
  _generated/     # Auto-generated Convex files (DO NOT EDIT)

scripts/
  *.py            # Data import/processing scripts
```

### Convex Backend

- **Schema**: Use `v` validator from `convex/values` for type safety
- **Queries**: Use `query()` with `handler` async function
- **Mutations**: Use `mutation()` for data modifications
- **HTTP Actions**: Use `httpAction()` for custom endpoints
- **Generated Files**: Never manually edit files in `convex/_generated/`

### Naming Conventions

- React components: `PascalCase` (e.g., `AnimeDetail.tsx`)
- Functions/variables: `camelCase` (e.g., `searchQuery`)
- Database tables: `snake_case` or `camelCase` (be consistent)
- Files: Match the default export name for components

### Error Handling

- Use try-catch in async functions
- Convex HTTP actions should return Response objects with proper status codes
- Use type guards: `error instanceof Error ? error.message : String(error)`

### React Patterns

- Use functional components with hooks
- Destructure props in function parameters when possible
- Use `React.KeyboardEvent` for keyboard event types
- Inline styles use camelCase property names

## Python Scripts

Located in `scripts/` directory:
- Use type hints in docstrings
- Use `pathlib.Path` for file operations
- Handle JSON parsing with try-except
- Add progress bars with `tqdm` for long operations

## Environment

- Requires `.env.local` with `VITE_CONVEX_URL`
- Node.js with npm
- Python 3.12+ with uv package manager

## Git

- Do NOT commit `.env.local` or `convex/_generated/` or any .env files in general
- Do NOT commit `node_modules/` or `__pycache__/`
