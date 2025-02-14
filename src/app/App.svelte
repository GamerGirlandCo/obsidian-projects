<script lang="ts">
  import { Callout, Loading, Typography } from "obsidian-svelte";
  import { onMount } from "svelte";

  import { createProject } from "src/lib/data-api";
  import { api } from "src/lib/stores/api";
  import { dataFrame, dataSource } from "src/lib/stores/dataframe";
  import { i18n } from "src/lib/stores/i18n";
  import { app } from "src/lib/stores/obsidian";
  import { settings } from "src/lib/stores/settings";
  import { ViewApi } from "src/lib/view-api";
  import { CreateProjectModal } from "src/modals/create-project-modal";

  import AppContainer from "./AppContainer.svelte";
  import { createDemoProject } from "./onboarding/demo-project";
  import { OnboardingModal } from "./onboarding/onboarding-modal";
  import View from "./View.svelte";

  let projectId: string | undefined;
  let viewId: string | undefined;

  $: ({ projects } = $settings);

  let querying: Promise<void>;

  $: {
    // Perform a full refresh of the data frame whenever the data source
    // changes.
    querying = (async () => {
      if ($dataSource) {
        dataFrame.set(await $dataSource.queryAll());
      }
    })();
  }

  onMount(() => {
    if (!projects.length) {
      new OnboardingModal(
        $app,
        // Create from scratch.
        () => {
          new CreateProjectModal(
            $app,
            $i18n.t("modals.project.create.title"),
            $i18n.t("modals.project.create.cta"),
            settings.addProject,
            createProject()
          ).open();
        },
        // Try demo project.
        () => {
          createDemoProject($app.vault);
        }
      ).open();
    }
  });

  const wait = () => new Promise((res) => setTimeout(res, 500));
</script>

<!--
	@component

	App is the main application component and coordinates between the View and
	the Toolbar.
-->
<AppContainer {projects} bind:projectId bind:viewId let:project let:view>
  {#await querying}
    {#await wait() then}
      <Loading />
    {/await}
  {:then}
    {#if project && view && $dataSource}
      <View
        {project}
        {view}
        readonly={$dataSource.readonly()}
        api={new ViewApi($app, $dataSource, $api)}
        onConfigChange={settings.updateViewConfig}
        frame={$dataFrame}
      />
    {/if}
  {:catch error}
    <div style="padding: var(--size-4-3)">
      <Callout title={error.name} icon="zap" variant="danger">
        <Typography variant="body">{error.message}</Typography>
      </Callout>
    </div>
  {/await}
</AppContainer>
