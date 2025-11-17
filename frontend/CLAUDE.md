# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated**: Commit `ab87187` - "Update ChatResponse.tsx"

## Project Overview

Adaptation Atlas Co-Pilot Frontend - A React 19 + TypeScript + Vite application providing the user interface for the climate adaptation AI assistant. Built with modern React features including the React Compiler for optimization, CSS Modules for scoped styling, Tailwind CSS utilities, and a component-based architecture. Includes full backend integration with SSE streaming, authentication, and Observable Plot-based visualizations.

## Essential Commands

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:5173) with HMR
npm run build        # TypeScript check + production build to dist/
npm run preview      # Preview production build locally
npm run lint         # Run ESLint on all .ts/.tsx files
npm run format       # Format code with Prettier

# Type generation from OpenAPI spec
npm run generate-types  # Generate TypeScript types from backend/openapi.json

# Install dependencies
npm install          # Install all dependencies

# Run a single test (when testing is added)
# npm test -- ComponentName.test.tsx
```

## Architecture

### Component Structure

```
App.tsx                           # Root component with auth routing
├── Login.tsx                     # Authentication form
└── Chat.tsx                      # Main chat layout and orchestrator
    ├── PromptBuilderSidebar.tsx  # Collapsible sidebar with sections
    │   └── SidebarSection.tsx    # Individual sidebar section (×5)
    ├── EmptyState.tsx            # Welcome/empty state container (shown when no events)
    │   ├── HeroSection.tsx       # Hero with gradient and welcome message
    │   └── ExamplePrompts.tsx    # Example prompt buttons
    ├── PromptBox.tsx             # Input component (always visible)
    ├── ChatResponse.tsx          # Multi-turn conversation display
    │                             # Groups events into turns, renders user messages,
    │                             # intermediate steps, artifacts, and final AI responses
    └── Charts/                   # Observable Plot visualizations
        ├── Main.tsx              # Base Chart component
        ├── Bar.tsx               # Bar chart implementation
        └── Area.tsx              # Area chart (placeholder)
```

**Component Files**: All components are located in `src/components/` with corresponding `.module.css` files for scoped styling. Each component is self-contained with its own styles, following the single responsibility principle.

### Layout Architecture

The application uses a three-column layout:

1. **Left Gradient Bar** (92px) - Logo and user avatar with green gradient
2. **Collapsible Sidebar** (320px) - "Prompt Builder" with expandable sections:
   - Geography, Climate Hazards, Exposure, Adaptive Capacity, Attachments
3. **Main Content Area** - Hero section with example prompts and primary PromptBox

### State Management

**Global State (Zustand):**
- `chatStore.ts`: Centralized chat state with Redux DevTools integration
  - `status`: Chat status ('idle' | 'streaming' | 'complete' | 'error')
  - `events`: Array of StreamEvent objects (user messages, AI messages, tool calls, charts, errors)
  - `userQuery`: Current user query
  - `threadId`: Backend conversation thread ID for multi-turn conversations
  - Actions: `startStreaming`, `addEvent`, `finishStreaming`, `setError`, `setThreadId`, `reset`
  - DevTools integration: Named actions for Redux DevTools debugging in development mode

**Local Component State:**
- PromptBox: Input value, focus state
- Chat: Sidebar section expand/collapse, selected context
- Login: Form values (username/password)

**State Flow:**
```
User submits → Chat.handlePromptSubmit
  → chatStore.startStreaming (adds user message to events, preserves threadId for multi-turn)
  → sendChatMessage (API call with SSE, includes threadId if exists)
  → Stream events → chatStore.addEvent (accumulates events)
  → Extract threadId from first message if not set
  → ChatResponse groups events into conversation turns and renders in real-time
  → chatStore.finishStreaming on completion
```

### Styling System

**CSS Architecture:**
- Global design tokens in `index.css` (color variables, typography)
- Component-specific CSS Modules (`.module.css` files)
- Tailwind CSS 4 utilities loaded once in `src/App.css` via `@import "tailwindcss";`
- IBM Plex Sans font family throughout

**Color System:**
```css
--primary: #2e7636        /* Main green */
--primary-dark: #235a2a   /* Darker green */
--gradient: linear-gradient(#1d5022, #74b95a)
--neutral-[50-900]: Gray scale from #f9fafb to #111927
```

**Tailwind Usage:**
- Vite config registers the Tailwind CSS plugin (`@tailwindcss/vite`) so utility classes are available in JSX.
- Use Tailwind utilities for rapid layout/spacing tweaks; fall back to CSS Modules for complex component styling.
- Extend or override design tokens by adding new CSS variables in `index.css` and referencing them through Tailwind's `var(--token)` pattern when needed.

### Icon Components

All icons in `src/assets/icons.tsx` as React components:
- Use `currentColor` for dynamic coloring
- Exported as named exports (ArrowUpIcon, XIcon, CopyIcon, CheckIcon, etc.)
- Include accessibility props (aria-hidden, role)

### API Integration

**API Client (`src/api/`):**
- `client.ts`: Core ApiClient class with token management
  - Handles Bearer token authentication via localStorage
  - Automatic 401 handling (clears token on unauthorized)
  - Generic fetch/post/get methods with error handling
  - OAuth2 form submission for login (`postForm`)
- `endpoints.ts`: API endpoint definitions
- `hooks.ts`: React hooks for authentication (`useAuth`)
- `streaming.ts`: SSE (Server-Sent Events) stream parsing utilities
  - `readStream`: Parses SSE data lines and invokes callbacks
  - `createStreamController`: Provides AbortSignal for cancellation
- `index.ts`: Convenience exports and `sendChatMessage` function

**Type Generation:**
- Types auto-generated from backend OpenAPI spec using `@hey-api/openapi-ts`
- Run `npm run generate-types` after backend API changes
- Generated types in `src/types/generated/`
- Custom types in `src/types/chat.ts`:
  - `ChatStatus`: 'idle' | 'streaming' | 'complete' | 'error'
  - `UserMessage`: User query events with id, timestamp, type, content
  - `ErrorEvent`: Error events with id, timestamp, error message
  - `StreamEvent`: Union of all event types (AI, Tool, Chart, User, Error messages)

**Authentication Flow:**
```
Login component → useAuth.login(username, password)
  → ApiClient.postForm('/auth/login') with OAuth2 form data
  → Backend returns access_token
  → ApiClient.setToken() stores in localStorage
  → Redirect to main app
  → All subsequent API calls include Bearer token
```

## Key Implementation Patterns

### Component Props Pattern

```typescript
interface ComponentProps {
  className?: string;           // For external styling
  onSubmit?: (value: string) => void;  // Event handlers
  context?: { /* data */ };     // Complex data structures
}
```

### Event Handling

- Form submission: Prevent default, handle with Enter key (Shift+Enter for newlines)
- Focus management: Track focus state for UI feedback
- Controlled components: All inputs use value/onChange pattern

### CSS Module Usage

```typescript
import styles from './Component.module.css';
// Apply: className={styles.container}
// Conditional: className={`${styles.base} ${isActive ? styles.active : ''}`}
```

### Chart Rendering Pattern (Observable Plot)

Charts use Observable Plot (`@observablehq/plot`) for data visualization:

```typescript
// Base Chart component (Charts/Main.tsx)
import * as Plot from '@observablehq/plot';

interface ChartProps {
  data: unknown[];
  spec: Plot.PlotOptions & { mark?: string };
  title?: string;
  className?: string;
}

// Specific chart types (e.g., Bar.tsx) create specs and pass to Chart
const spec: ChartProps['spec'] = {
  marginBottom: 90,
  x: { label: 'X Axis', tickRotate: -45 },
  y: { label: 'Y Axis', grid: true },
  marks: [
    Plot.barY(data, { x: 'category', y: 'value', fill: 'category' }),
    Plot.tip(data, Plot.pointer({ /* tooltip config */ })),
    Plot.ruleY([0]),
  ],
};

return <Chart data={data} spec={spec} title="Chart Title" />;
```

### Message Display Pattern (ChatResponse)

ChatResponse groups events into conversation turns, where each turn contains:
1. **User messages**: User queries that started the turn
2. **Intermediate messages**: Tool calls and intermediate AI responses (collapsed in `<details>` as "View steps")
3. **Artifacts**: Charts and visualizations (displayed prominently)
4. **Final AI message**: Last AI response in the turn (main response text)

**Multi-turn Conversation Handling:**
- Events are grouped by user message boundaries
- Each turn is rendered as a complete conversation exchange
- During streaming, the current turn's final message is determined dynamically
- Previous turns are locked in and won't toggle during new streams

Features:
- ReactMarkdown with `remark-gfm` for GitHub-flavored markdown rendering
- Custom markdown components for tables, code blocks with syntax highlighting
- Copy buttons for raw markdown content (using `utils/clipboard.ts`) positioned below each message
- Collapsible "View steps" dropdown showing reasoning chain (intermediate messages)

## Development Workflow

1. **Feature Development**:
   - Create component in `src/components/`
   - Add corresponding `.module.css` for styling
   - Import and integrate in parent component
   - For backend-dependent features, run `npm run generate-types` after API changes

2. **Styling Changes**:
   - Utility tweaks: Apply Tailwind classes directly in components
   - Component-specific: Edit `.module.css` files
   - Global/theme: Update CSS variables in `index.css`
   - Icons: Modify SVG paths in `icons.tsx`

3. **API Integration**:
   - Update backend OpenAPI spec first
   - Run `npm run generate-types` to regenerate types
   - Use generated types in API calls and components
   - For streaming: Use `sendChatMessage` with `onMessage`/`onError`/`onComplete` callbacks

4. **Performance Optimization**:
   - React Compiler handles automatic memoization
   - Use CSS Modules to prevent style recalculation
   - Keep component trees shallow when possible
   - Zustand DevTools enabled in development for state debugging

5. **Multi-turn Conversation Development**:
   - Remember that events array persists across turns (not cleared between queries)
   - Group events by user message boundaries when rendering
   - Prevent UI flicker by stabilizing which message is "final" during streaming
   - Extract and persist threadId from first message for subsequent turns
   - Test with multiple sequential queries to ensure proper turn grouping

## Current Implementation Status

### Completed ✅
- **Authentication**: Full OAuth2 login flow with token management
  - Login component with form validation
  - Token storage in localStorage
  - Automatic 401 handling and token refresh
  - Protected routes via App-level auth check
- **Chat Interface**: Three-column layout with all core features
  - PromptBuilderSidebar with SidebarSection sub-components
  - EmptyState with HeroSection and ExamplePrompts
  - PromptBox at Chat level for persistence across states
  - User avatar with login/logout functionality
- **Backend Integration**: Fully functional API client
  - SSE streaming with `sendChatMessage`
  - Type-safe API calls using generated types
  - Error handling and loading states
  - Thread-based conversation management
- **Multi-turn Conversations**: Full support for continuous conversations
  - Thread ID persistence across multiple queries
  - User messages stored in event stream
  - Conversation turn grouping in ChatResponse
  - State preservation across turns (events not cleared between queries)
  - Dynamic final message detection during streaming
- **Message Display**: ChatResponse with rich formatting
  - Real-time streaming updates
  - Conversation turn-based rendering
  - Collapsible "View steps" section for reasoning/tool calls
  - ReactMarkdown with GitHub-flavored markdown
  - Custom table and code block rendering
  - Copy-to-clipboard functionality for all text blocks (positioned below messages)
  - Stable rendering that prevents old messages from toggling during new streams
- **Visualizations**: Observable Plot integration
  - Base Chart component with responsive sizing
  - Bar chart implementation with tooltips and formatting
  - Area chart placeholder for future use
  - Dynamic chart rendering from streamed data
- **State Management**: Zustand store with DevTools
  - Chat state (status, events, query, threadId)
  - Actions for streaming lifecycle with named action types
  - Redux DevTools integration for debugging (dev mode only)
  - User message events integrated into stream
- **Icon System**: Complete set of UI icons (CopyIcon, CheckIcon, ArrowUpIcon, XIcon, etc.)
- **Styling**: CSS design system with variables and CSS Modules
- **Type Safety**: Full TypeScript coverage with strict mode
- **Code Quality**: ESLint + Prettier configuration

### In Progress 🚧
- Sidebar section content (expandable but empty - needs backend integration)
- Additional chart types (line, area, scatter)
- Error boundaries for better error handling

### Not Yet Implemented ❌
- File upload functionality (attachments section)
- Testing framework and tests
- Additional authentication methods (OAuth providers)
- User profile management
- Long-term conversation history persistence (beyond current session)
- Export/share functionality
- Accessibility improvements (ARIA labels, keyboard navigation)
- Mobile responsive optimizations
- Conversation history UI (sidebar with past conversations)
- Message editing and regeneration

## TypeScript Configuration

**Strict Mode Enabled** with:
- No implicit any
- Strict null checks
- No unused locals/parameters
- All ESLint recommended rules

**Module Resolution**:
- ESNext modules with bundler resolution
- JSX: react-jsx (no import React needed)
- Target: ES2022 for app code, ES2023 for build config

## Build Optimization

- **Vite**: Fast HMR, optimized dependency pre-bundling
- **Tailwind CSS plugin**: `@tailwindcss/vite` integrates utility generation into the Vite build
- **React Compiler**: Automatic component optimization via Babel plugin
- **Production Build**: TypeScript check → Vite bundling → Output to `dist/`
- **CSS**: Modules for scoping, PostCSS for processing

## Key Dependencies

**Core:**
- `react@19.1.1` + `react-dom@19.1.1`: React 19 with new features
- `vite@7.1.7`: Build tool and dev server
- `typescript@5.9.3`: Type safety
- `zustand@5.0.8`: State management

**UI & Visualization:**
- `@observablehq/plot@0.6.17`: Data visualization library
- `react-markdown@10.1.0`: Markdown rendering
- `remark-gfm@4.0.1`: GitHub-flavored markdown support
- `tailwindcss@4.1.16` + `@tailwindcss/vite@4.1.16`: Utility-first CSS

**Development:**
- `@hey-api/openapi-ts@0.87.1`: OpenAPI type generation
- `prettier@3.6.2`: Code formatting
- `eslint@9.36.0` + TypeScript ESLint plugins: Linting
- `babel-plugin-react-compiler@19.1.0-rc.3`: React optimization

## Environment Variables

Set in `.env` or via `VITE_*` environment variables:
- `VITE_API_URL`: Backend API base URL (default: `//localhost:8000`)

## Backend Integration

**Currently Integrated:**
- ✅ Authentication endpoints (`/auth/login`)
- ✅ Chat streaming endpoint (`/chat/stream`) with SSE
- ✅ Type generation from `backend/openapi.json`
- ✅ Thread-based conversation management with multi-turn support
- ✅ User message display in conversation flow
- ✅ Real-time event streaming with stable rendering

**Integration Pattern:**
```typescript
// Import API function and types
import { sendChatMessage } from '../api';
import type { AiResponseMessage, BarChartResponseMessage } from '../types/generated';

// Use with callbacks for streaming
await sendChatMessage(query, threadId, {
  onMessage: (message) => {
    // Handle streamed message
    chatStore.addEvent(message);
  },
  onError: (error) => chatStore.setError(error.message),
  onComplete: () => chatStore.finishStreaming(),
  signal: abortController.signal, // For cancellation
});
```

**File Structure:**
```
src/
├── api/
│   ├── client.ts        # ApiClient class with auth
│   ├── endpoints.ts     # Endpoint constants
│   ├── hooks.ts         # useAuth hook
│   ├── streaming.ts     # SSE parsing utilities
│   └── index.ts         # Main exports
├── components/
│   ├── Chat.tsx                      # Main chat orchestrator
│   ├── ChatResponse.tsx              # Message display with turn grouping
│   ├── PromptBox.tsx                 # Input component
│   ├── PromptBuilderSidebar.tsx      # Collapsible sidebar
│   ├── SidebarSection.tsx            # Individual sidebar section
│   ├── EmptyState.tsx                # Welcome state container
│   ├── HeroSection.tsx               # Hero with gradient
│   ├── ExamplePrompts.tsx            # Example prompt buttons
│   ├── Login.tsx                     # Authentication form
│   └── Charts/
│       ├── Main.tsx                  # Base Chart component
│       ├── Bar.tsx                   # Bar chart implementation
│       └── Area.tsx                  # Area chart (placeholder)
├── store/
│   └── chatStore.ts     # Zustand store with DevTools
├── types/
│   ├── generated/       # Auto-generated from OpenAPI
│   │   ├── index.ts
│   │   └── types.gen.ts
│   └── chat.ts          # Custom types (StreamEvent, ChatStatus, UserMessage, ErrorEvent)
├── utils/
│   └── clipboard.ts     # Clipboard utilities
└── assets/
    └── icons.tsx        # Icon components
```
