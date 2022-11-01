import type { DataFrame } from "./lib/data";

declare module "obsidian" {
  interface App {
    plugins: {
      enabledPlugins: Set<string>;
      plugins: {
        [id: string]: {
          onRegisterProjectView?: () => ProjectView;
        };
      };
    };
  }
}
