<script lang="ts">
  import dayjs from "dayjs";
  import { Select, Typography } from "obsidian-svelte";
  import { get } from "svelte/store";

  import { Field } from "src/components/Field";
  import {
    ViewContent,
    ViewHeader,
    ViewLayout,
    ViewToolbar,
  } from "src/components/Layout";
  import { DataFieldType, type DataFrame } from "src/lib/data";
  import { createDataRecord } from "src/lib/data-api";
  import { i18n } from "src/lib/stores/i18n";
  import { app } from "src/lib/stores/obsidian";
  import type { ViewApi } from "src/lib/view-api";
  import { CreateNoteModal } from "src/modals/create-note-modal";
  import { EditNoteModal } from "src/modals/edit-note-modal";
  import type { ProjectDefinition } from "src/types";
  import { fieldToSelectableValue } from "src/views/helpers";

  import {
    addInterval,
    chunkDates,
    computeDateInterval,
    generateDates,
    generateTitle,
    groupRecordsByField,
    isCalendarInterval,
    subtractInterval,
  } from "./calendar";
  import {
    CalendarDay,
    Navigation,
    Table,
    TableBody,
    TableColumnHeaderCell,
    TableHead,
    TableRow,
  } from "./components";
  import type { CalendarConfig } from "./types";

  export let project: ProjectDefinition;
  export let frame: DataFrame;
  export let readonly: boolean;
  export let api: ViewApi;

  export let config: CalendarConfig | undefined;
  export let onConfigChange: (cfg: CalendarConfig) => void;

  $: ({ fields, records } = frame);

  let anchorDate: dayjs.Dayjs = dayjs();

  $: dateFields = fields
    .filter((field) => !field.repeated)
    .filter((field) => field.type === DataFieldType.Date);
  $: dateField =
    dateFields.find((field) => config?.dateField === field.name) ??
    dateFields[0];

  $: booleanFields = fields
    .filter((field) => !field.repeated)
    .filter((field) => field.type === DataFieldType.Boolean);
  $: booleanField = fields.find((field) => config?.checkField === field.name);

  $: interval = config?.interval ?? "week";

  $: dateInterval = computeDateInterval(anchorDate, interval);

  $: groupedRecords = dateField
    ? groupRecordsByField(records, dateField.name)
    : {};
  $: title = dateInterval ? generateTitle(dateInterval) : "";
  $: dates = dateInterval ? generateDates(dateInterval) : [];

  $: numColumns = Math.min(dates.length, 7);
  $: weeks = chunkDates(dates, numColumns);
  $: weekDays = dates.slice(0, numColumns).map((date) =>
    $i18n.t("views.calendar.weekday", {
      value: date.toDate(),
      formatParams: {
        value: { weekday: "short" },
      },
    })
  );

  function handleIntervalChange(interval: string) {
    if (isCalendarInterval(interval)) {
      onConfigChange({ ...config, interval });
    }
  }
  function handleDateFieldChange(dateField: string) {
    onConfigChange({ ...config, dateField });
  }
  function handleCheckFieldChange(checkField: string) {
    onConfigChange({ ...config, checkField });
  }
</script>

<ViewLayout>
  <ViewHeader>
    <ViewToolbar variant="secondary">
      <Navigation
        slot="left"
        onNext={() => (anchorDate = addInterval(anchorDate, interval))}
        onPrevious={() => (anchorDate = subtractInterval(anchorDate, interval))}
        onToday={() => (anchorDate = dayjs())}
      />
      <Typography slot="middle" variant="h2" nomargin>{title}</Typography>
      <svelte:fragment slot="right">
        <Field name={$i18n.t("views.calendar.fields.date")}>
          <Select
            value={dateField?.name ?? ""}
            options={dateFields.map(fieldToSelectableValue)}
            placeholder={$i18n.t("views.calendar.fields.none") ?? ""}
            on:change={({ detail }) => handleDateFieldChange(detail)}
          />
        </Field>
        <Field name={$i18n.t("views.calendar.fields.check")}>
          <Select
            allowEmpty
            value={booleanField?.name ?? ""}
            options={booleanFields.map(fieldToSelectableValue)}
            placeholder={$i18n.t("views.calendar.fields.none") ?? ""}
            on:change={({ detail }) => handleCheckFieldChange(detail)}
          />
        </Field>
        <Select
          value={config?.interval ?? "week"}
          options={[
            {
              label: $i18n.t("views.calendar.intervals.month", {
                count: 1,
              }),
              value: "month",
            },
            {
              label: $i18n.t("views.calendar.intervals.weekWithCount", {
                count: 2,
              }),
              value: "2weeks",
            },
            {
              label: $i18n.t("views.calendar.intervals.week", {
                count: 1,
              }),
              value: "week",
            },
            {
              label: $i18n.t("views.calendar.intervals.dayWithCount", {
                count: 3,
              }),
              value: "3days",
            },
            {
              label: $i18n.t("views.calendar.intervals.day", {
                count: 1,
              }),
              value: "day",
            },
          ]}
          on:change={({ detail }) => handleIntervalChange(detail)}
        />
      </svelte:fragment>
    </ViewToolbar>
  </ViewHeader>
  <ViewContent>
    <Table grow>
      <TableHead>
        <TableRow>
          {#each weekDays as weekDay}
            <TableColumnHeaderCell>{weekDay}</TableColumnHeaderCell>
          {/each}
        </TableRow>
      </TableHead>
      <TableBody>
        {#each weeks as week}
          <TableRow>
            {#each week as date}
              <CalendarDay
                {date}
                checkField={booleanField?.name}
                onRecordUpdate={(date, record) => {
                  if (dateField) {
                    api.updateRecord(
                      {
                        ...record,
                        values: {
                          ...record.values,
                          [dateField.name]: date.format("YYYY-MM-DD"),
                        },
                      },
                      fields
                    );
                  }
                }}
                records={groupedRecords[date.format("YYYY-MM-DD")] || []}
                onEntryClick={(entry) => {
                  if (entry) {
                    new EditNoteModal(
                      get(app),
                      fields,
                      (record) => {
                        api.updateRecord(record, fields);
                      },
                      entry
                    ).open();
                  }
                }}
                onEntryAdd={() => {
                  if (dateField && !readonly) {
                    new CreateNoteModal($app, project, (name, templatePath) => {
                      if (dateField) {
                        api.addRecord(
                          createDataRecord(name, project, {
                            [dateField.name]: date.toDate(),
                          }),
                          templatePath
                        );
                      }
                    }).open();
                  }
                }}
              />
            {/each}
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </ViewContent>
</ViewLayout>
