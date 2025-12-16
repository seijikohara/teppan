# Teppan

A headless code editor library with framework-agnostic core and official bindings for major UI frameworks.

## Overview

Teppan provides a modular architecture that separates editor logic from rendering. The core packages handle state management, text manipulation, rendering, and theming, while framework-specific bindings provide components and hooks for integration.

The headless design allows the core functionality to be used with any UI framework or without a framework at all.

## Packages

### Core

| Package | Description |
|---------|-------------|
| `@teppan/wasm-core` | WASM core built with Rust. Provides Piece Table data structure, text operations, and undo/redo history. |
| `@teppan/state` | State management. Provides EditorState, Transaction, and Extension system. |
| `@teppan/view` | DOM rendering and view management. Provides EditorView with virtualized rendering and event handling. |
| `@teppan/theme` | Theme system. Provides theme interfaces and default light/dark themes. |
| `@teppan/highlight` | Syntax highlighting. Provides tokenization and highlighting infrastructure. |

### Framework Bindings

| Package | Description |
|---------|-------------|
| `@teppan/react` | React bindings. Provides React components and hooks for integration. |
| `@teppan/vue` | Vue 3 bindings. Provides Vue components and composables for integration. |
| `@teppan/svelte` | Svelte 5 bindings. Provides Svelte components with runes support. |

## Requirements

- [Bun](https://bun.sh/) >= 1.1.0
- Node.js >= 20.0.0
- [Rust](https://www.rust-lang.org/) (for building wasm-core)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/) (for building wasm-core)

## Installation

```bash
# Install all dependencies
bun install

# Build all packages
bun run build
```

## Development

```bash
# Watch mode for all packages
bun run dev

# Type checking
bun run typecheck

# Linting
bun run lint

# Build specific package
bun run --filter @teppan/view build
```

## Usage

### React

```tsx
import { CodeEditor, useEditor } from '@teppan/react';

function App() {
  return (
    <CodeEditor
      initialContent="console.log('Hello');"
      language="javascript"
      onChange={(content) => console.log(content)}
    />
  );
}
```

### Vue 3

```vue
<script setup>
import { CodeEditor } from '@teppan/vue';
import { ref } from 'vue';

const code = ref('console.log("Hello");');
</script>

<template>
  <CodeEditor v-model="code" language="javascript" />
</template>
```

### Svelte 5

```svelte
<script>
  import { CodeEditor } from '@teppan/svelte';

  let code = $state('console.log("Hello");');
</script>

<CodeEditor bind:value={code} language="javascript" />
```

### Headless Core

```typescript
import { EditorState, EditorView } from '@teppan/view';

const state = EditorState.create({
  doc: 'Hello World',
  extensions: [],
});

const view = new EditorView({
  state,
  parent: document.getElementById('editor')!,
});
```

## Architecture

```
teppan/
├── packages/
│   ├── wasm-core/         # Rust/WASM core (Piece Table, text ops)
│   │   └── src/
│   │       └── lib.rs
│   ├── state/             # State management
│   │   └── src/
│   │       └── index.ts
│   ├── view/              # DOM rendering
│   │   └── src/
│   │       └── index.ts
│   ├── theme/             # Theme system
│   │   └── src/
│   │       └── index.ts
│   ├── highlight/         # Syntax highlighting
│   │   └── src/
│   │       └── index.ts
│   └── bindings/          # Framework bindings
│       ├── react/
│       │   └── src/
│       │       ├── CodeEditor.tsx
│       │       ├── useEditor.ts
│       │       └── index.ts
│       ├── vue/
│       │   └── src/
│       │       ├── CodeEditor.vue
│       │       ├── useEditor.ts
│       │       └── index.ts
│       └── svelte/
│           └── src/
│               ├── CodeEditor.svelte
│               ├── createEditor.svelte.ts
│               └── index.ts
├── package.json
├── tsconfig.json
└── biome.json
```

## License

MIT
