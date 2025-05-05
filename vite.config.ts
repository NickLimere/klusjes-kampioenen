import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-native": "react-native-web",
      // Add platform-specific extensions
      ".ios.js": ".web.js",
      ".android.js": ".web.js",
    },
    extensions: [".web.js", ".js", ".ts", ".tsx"],
  },
  define: {
    // Required for react-native-web
    __DEV__: JSON.stringify(mode === "development"),
  },
}));
