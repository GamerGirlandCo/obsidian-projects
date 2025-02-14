import { get } from "svelte/store";

import type { DataQueryResult } from "src/custom-view-api";
import { customViews } from "src/lib/stores/custom-views";
import type { ViewApi } from "src/lib/view-api";
import type { ProjectDefinition, ViewDefinition } from "src/types";

export interface ViewProps {
  view: ViewDefinition;
  dataProps: DataQueryResult;
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
  viewApi: ViewApi;
  readonly: boolean;
  project: ProjectDefinition;
}

export function useView(node: HTMLElement, props: ViewProps) {
  // Keep track of previous view id to determine if view should be invalidated.
  let viewId = props.view.id;

  const projectId = props.project.id;

  let projectView = get(customViews)[props.view.type];

  if (projectView) {
    // Component just mounted, so treat all properties as dirty.
    projectView.onOpen({
      viewId: props.view.id,
      project: props.project,
      contentEl: node,
      config: props.config,
      saveConfig: props.onConfigChange,
      viewApi: props.viewApi,
      readonly: props.readonly,
    });
    projectView.onData(props.dataProps);
  }

  return {
    update(newprops: ViewProps) {
      // User switched to a different view.
      const dirty =
        newprops.view.id !== viewId || newprops.project.id !== projectId;

      if (dirty) {
        // Clean up previous view.
        projectView?.onClose();

        node.empty();

        // Look up the next view.
        projectView = get(customViews)[newprops.view.type];

        if (projectView) {
          projectView.onOpen({
            contentEl: node,
            viewId: newprops.view.id,
            project: newprops.project,
            viewApi: newprops.viewApi,
            readonly: newprops.readonly,
            config: newprops.config,
            saveConfig: newprops.onConfigChange,
          });
          projectView.onData(newprops.dataProps);
        }

        viewId = newprops.view.id;
      } else {
        projectView?.onData(newprops.dataProps);
      }
    },
    destroy() {
      projectView?.onClose();
    },
  };
}
