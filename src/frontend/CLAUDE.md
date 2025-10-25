# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Adaptation Atlas Co-Pilot Frontend - A React 19 + TypeScript + Vite application providing the user interface for the climate adaptation AI assistant. Built with modern React features including the React Compiler for optimization, CSS Modules for scoped styling, Tailwind CSS utilities, and a component-based architecture.

## Essential Commands

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:5173) with HMR
npm run build        # TypeScript check + production build to dist/
npm run preview      # Preview production build locally
npm run lint         # Run ESLint on all .ts/.tsx files

# Install dependencies
npm install          # Install all dependencies

# Run a single test (when testing is added)
# npm test -- ComponentName.test.tsx
```

## Architecture

### Component Structure

```
App.tsx                      # Root wrapper component
└── Welcome.tsx              # Main application layout
    └── PromptBox.tsx        # Reusable input component with context tags
```

### Layout Architecture

The application uses a three-column layout:

1. **Left Gradient Bar** (92px) - Logo and user avatar with green gradient
2. **Collapsible Sidebar** (320px) - "Prompt Builder" with expandable sections:
   - Geography, Climate Hazards, Exposure, Adaptive Capacity, Attachments
3. **Main Content Area** - Hero section with example prompts and primary PromptBox

### State Flow

- Component-level state using React hooks (useState)
- PromptBox handles local input state, passes values up via onSubmit callbacks
- Sidebar collapse/expand state managed in Welcome component
- No global state management yet (Redux/Zustand to be added)

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
- Exported as named exports (ArrowUpIcon, XIcon, etc.)
- Include accessibility props (aria-hidden, role)

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

## Development Workflow

1. **Feature Development**:
   - Create component in `src/components/`
   - Add corresponding `.module.css` for styling
   - Import and integrate in parent component

2. **Styling Changes**:
   - Utility tweaks: Apply Tailwind classes directly in components
   - Component-specific: Edit `.module.css` files
   - Global/theme: Update CSS variables in `index.css`
   - Icons: Modify SVG paths in `icons.tsx`

3. **Performance Optimization**:
   - React Compiler handles automatic memoization
   - Use CSS Modules to prevent style recalculation
   - Keep component trees shallow when possible

## Current Implementation Status

### Completed
- Welcome page with three-column layout
- PromptBox component with context tags
- Sidebar with collapsible sections
- Icon system with all UI icons
- Responsive design (mobile breakpoint at 768px)
- CSS design system with variables

### In Progress
- Example prompt cards (UI only, no functionality)
- Sidebar section content (expandable but empty)
- Submit handlers (placeholder functions)

### Not Yet Implemented
- Backend API integration
- Chat message display components
- Visualization/chart components (Plotly integration planned)
- Authentication flow
- Global state management
- Testing framework and tests
- Error boundaries and loading states
- File upload functionality
- Real-time updates (WebSocket/SSE)

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

## Integration Points

Future backend integration will require:
1. API client setup (fetch/axios)
2. WebSocket for real-time chat
3. Authentication token management
4. File upload to S3 (presigned URLs)
5. Chart data fetching and rendering

The PromptBox `onSubmit` and sidebar section handlers are the primary integration points for connecting to the backend agent system described in the root CLAUDE.md.
