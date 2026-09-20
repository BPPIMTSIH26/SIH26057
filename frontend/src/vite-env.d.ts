/// <reference types="vite/client" />

// Extend vite/client with CSS module declarations for maplibre-gl
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
