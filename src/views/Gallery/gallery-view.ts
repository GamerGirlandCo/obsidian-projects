import {
  ProjectView,
  type DataQueryResult,
  type ProjectViewProps,
} from "src/custom-view-api";

import GalleryViewSvelte from "./GalleryView.svelte";
import type { GalleryConfig } from "./types";

export class GalleryView extends ProjectView<GalleryConfig> {
  view?: GalleryViewSvelte | null;
  props?: ProjectViewProps;

  getViewType(): string {
    return "gallery";
  }
  getDisplayName(): string {
    return "Gallery";
  }
  getIcon(): string {
    return "layout-grid";
  }

  async onData({ data }: DataQueryResult) {
    this.view?.$set({ frame: data });
  }

  async onOpen(props: ProjectViewProps<GalleryConfig>) {
    this.view = new GalleryViewSvelte({
      target: props.contentEl,
      props: {
        frame: { fields: [], records: [] },
        api: props.viewApi,
        config: props.config,
        onConfigChange: props.saveConfig,
      },
    });
  }

  async onClose() {
    this.view?.$destroy();
    this.view = null;
  }
}
