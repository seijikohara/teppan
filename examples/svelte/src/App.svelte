<script lang="ts">
  import { CodeEditor } from "@teppan/svelte";
  import { createHighlighterExtension, typescript } from "@teppan/highlight";

  // Create syntax highlighting extension for TypeScript
  const highlighter = createHighlighterExtension({ language: typescript });

  // Sample code showcasing all supported syntax highlighting tokens
  let code = $state(`// Comment: This is a line comment
/* Block comment:
   Multi-line comment support */

// Keywords & Constants
const PI = 3.14159;  // number
let isEnabled = true;  // boolean
var legacy = null;  // null
const hex = 0xFF;  // hexadecimal number
const binary = 0b1010;  // binary number

// String types
const message = "Hello, World!";  // double-quoted string
const name = 'Teppan';  // single-quoted string
const template = \`Value: \${PI}\`;  // template literal

// Regular expression
const pattern = /[a-z]+/gi;

// Function definition
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

// Arrow function & operators
const add = (a: number, b: number) => a + b;
const result = add(10, 20) * 2;

// Class definition
class Editor {
  private readonly version = "1.0.0";

  constructor(public name: string) {}

  getName(): string {
    return this.name;
  }
}

// Async/await
async function fetchData(url: string): Promise<void> {
  const response = await fetch(url);
  console.log(response);
}

// Interface & Type
interface Config {
  theme: "dark" | "light";
  fontSize: number;
}

type Status = "idle" | "loading" | "error";
`);

  let showContent = $state(false);
</script>

<div class="container">
  <div class="inner">
    <header class="header">
      <h1 class="title">Teppan Editor</h1>
      <p class="subtitle">A modern, headless code editor for Svelte</p>
      <span class="badge">Svelte Example</span>
    </header>

    <div class="editor-wrapper">
      <div class="editor-container">
        <CodeEditor bind:value={code} extensions={[highlighter]} />
      </div>
    </div>

    <details class="details" open={showContent}>
      <summary
        class="summary"
        onclick={(e) => {
          e.preventDefault();
          showContent = !showContent;
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          style="opacity: 0.7"
        >
          <path
            d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z"
          />
        </svg>
        Current Content
      </summary>
      <pre class="pre">{code}</pre>
    </details>
  </div>
</div>

<style>
  .container {
    min-height: 100vh;
    background: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%);
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans",
      Helvetica, Arial, sans-serif;
    color: #e6edf3;
  }

  .inner {
    max-width: 900px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: 32px;
    text-align: center;
  }

  .title {
    font-size: 32px;
    font-weight: 600;
    margin: 0;
    background: linear-gradient(135deg, #ff3e00 0%, #ff6b35 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    font-size: 14px;
    color: #8b949e;
    margin-top: 8px;
  }

  .badge {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(255, 62, 0, 0.15);
    color: #ff3e00;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    margin-top: 12px;
  }

  .editor-wrapper {
    margin-bottom: 24px;
  }

  .editor-container {
    height: 320px;
  }

  .details {
    background: rgba(22, 27, 34, 0.8);
    border: 1px solid #30363d;
    border-radius: 12px;
    overflow: hidden;
    backdrop-filter: blur(8px);
  }

  .summary {
    padding: 12px 16px;
    cursor: pointer;
    user-select: none;
    font-size: 14px;
    font-weight: 500;
    color: #8b949e;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: color 0.15s ease;
  }

  .summary:hover {
    color: #c9d1d9;
  }

  .pre {
    margin: 0;
    padding: 16px;
    background: #0d1117;
    color: #8b949e;
    font-size: 13px;
    line-height: 1.5;
    overflow: auto;
    border-top: 1px solid #21262d;
    font-family: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular,
      Menlo, monospace;
  }
</style>
