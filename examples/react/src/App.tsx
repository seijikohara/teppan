import { createHighlighterExtension, typescript } from "@teppan/highlight";
import { CodeEditor } from "@teppan/react";
import { bracketMatching } from "@teppan/state";
import { useState } from "react";

// Create syntax highlighting extension for TypeScript
const highlighter = createHighlighterExtension({ language: typescript });

// Create bracket matching extension
const brackets = bracketMatching();

// Sample code showcasing all supported syntax highlighting tokens
const initialCode = `// Comment: This is a line comment
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
`;

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)",
    padding: "40px 20px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    color: "#e6edf3",
  } as const,
  inner: {
    maxWidth: "900px",
    margin: "0 auto",
  } as const,
  header: {
    marginBottom: "32px",
    textAlign: "center" as const,
  },
  title: {
    fontSize: "32px",
    fontWeight: 600,
    margin: 0,
    background: "linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  } as const,
  subtitle: {
    fontSize: "14px",
    color: "#8b949e",
    marginTop: "8px",
  } as const,
  badge: {
    display: "inline-block",
    padding: "4px 12px",
    background: "rgba(56, 139, 253, 0.15)",
    color: "#58a6ff",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 500,
    marginTop: "12px",
  } as const,
  editorWrapper: {
    marginBottom: "24px",
  } as const,
  editorContainer: {
    height: "320px",
  } as const,
  details: {
    background: "rgba(22, 27, 34, 0.8)",
    border: "1px solid #30363d",
    borderRadius: "12px",
    overflow: "hidden",
    backdropFilter: "blur(8px)",
  } as const,
  summary: {
    padding: "12px 16px",
    cursor: "pointer",
    userSelect: "none" as const,
    fontSize: "14px",
    fontWeight: 500,
    color: "#8b949e",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "color 0.15s ease",
  } as const,
  pre: {
    margin: 0,
    padding: "16px",
    background: "#0d1117",
    color: "#8b949e",
    fontSize: "13px",
    lineHeight: 1.5,
    overflow: "auto",
    borderTop: "1px solid #21262d",
    fontFamily:
      '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace',
  } as const,
};

function App() {
  const [code, setCode] = useState(initialCode);

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <header style={styles.header}>
          <h1 style={styles.title}>Teppan Editor</h1>
          <p style={styles.subtitle}>
            A modern, headless code editor for React
          </p>
          <span style={styles.badge}>React Example</span>
        </header>

        <div style={styles.editorWrapper}>
          <div style={styles.editorContainer}>
            <CodeEditor
              initialContent={code}
              onChange={setCode}
              extensions={[highlighter, brackets]}
            />
          </div>
        </div>

        <details style={styles.details}>
          <summary style={styles.summary}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              style={{ opacity: 0.7 }}
              aria-hidden="true"
            >
              <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" />
            </svg>
            Current Content
          </summary>
          <pre style={styles.pre}>{code}</pre>
        </details>
      </div>
    </div>
  );
}

export default App;
