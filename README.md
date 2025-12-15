# Teppan

A headless code editor library with framework-agnostic core and official bindings for major UI frameworks.

## Overview

Teppan provides a modular architecture that separates editor logic from rendering. The core package handles state management, text manipulation, and event handling, while framework-specific packages provide components and hooks for integration.

The headless design allows the core functionality to be used with any UI framework or without a framework at all.

## Packages

| Package | Description |
|---------|-------------|
| `@teppan/core` | Framework-agnostic headless core. Provides editor state management, text manipulation, and event handling. |
| `@teppan/react` | React bindings. Provides React components and hooks for integration. |
| `@teppan/vue` | Vue 3 bindings. Provides Vue components and composables for integration. |
| `@teppan/svelte` | Svelte 5 bindings. Provides Svelte components with runes support. |

## Requirements

- [Bun](https://bun.sh/) >= 1.1.0
- Node.js >= 20.0.0

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
bun run --filter @teppan/core build
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
import { Editor } from '@teppan/core';

const editor = new Editor(
  { initialContent: 'Hello', language: 'plaintext' },
  { onChange: (content) => console.log(content) }
);

editor.insertText(' World');
console.log(editor.getContent()); // "Hello World"
```

## Architecture

```
teppan/
├── packages/
│   ├── core/           # Headless core
│   │   └── src/
│   │       ├── editor.ts
│   │       ├── types.ts
│   │       └── index.ts
│   ├── react/          # React bindings
│   │   └── src/
│   │       ├── CodeEditor.tsx
│   │       ├── useEditor.ts
│   │       └── index.ts
│   ├── vue/            # Vue 3 bindings
│   │   └── src/
│   │       ├── CodeEditor.vue
│   │       ├── useEditor.ts
│   │       └── index.ts
│   └── svelte/         # Svelte 5 bindings
│       └── src/
│           ├── CodeEditor.svelte
│           ├── createEditor.svelte.ts
│           └── index.ts
├── package.json
├── tsconfig.json
└── biome.json
```

## License

MIT
