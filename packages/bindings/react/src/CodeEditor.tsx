import { applyTheme, injectBaseStyles } from "@teppan/theme";
import { useEffect } from "react";
import { type UseEditorOptions, useEditor } from "./useEditor";

export interface CodeEditorProps extends UseEditorOptions {
  /** CSS class name for the container */
  className?: string;
  /** Inline styles for the container */
  style?: React.CSSProperties;
  /** Aria label for accessibility */
  ariaLabel?: string;
  /** Height of the editor */
  height?: string | number;
}

/**
 * React code editor component
 */
export function CodeEditor({
  className,
  style,
  ariaLabel = "Code editor",
  height = "300px",
  theme,
  ...options
}: CodeEditorProps) {
  const { containerRef, view } = useEditor({ ...options, theme });

  // Inject base styles on mount
  useEffect(() => {
    injectBaseStyles();
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (view && theme) {
      applyTheme(view.dom, theme);
    }
  }, [view, theme]);

  // Update aria-label
  useEffect(() => {
    if (view) {
      view.dom.setAttribute("aria-label", ariaLabel);
    }
  }, [view, ariaLabel]);

  const containerStyle: React.CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
    ...style,
  };

  return (
    <div ref={containerRef} className={className} style={containerStyle} />
  );
}
