import type { TFile } from "obsidian";
import type { ProjectDefinition } from "../types";

/**
 * DataFrame is the core data structure that contains structured data for a
 * collection of notes.
 */
export interface DataFrame {
  /**
   * fields defines the schema for the data frame. Each field describes the
   * values in each DataRecord.
   */
  readonly fields: DataField[];

  /**
   * records holds the data from each note.
   */
  readonly records: DataRecord[];
}

/**
 * DataField holds metadata for a value in DataRecord, for example a front
 * matter property.
 */
export interface DataField {
  /**
   * name references the a property (key) in the DataRecord values object.
   */
  readonly name: string;

  /**
   * type defines the data type for the field.
   */
  readonly type: DataFieldType;

  /**
   * identifier defines whether this field identifies a DataRecord.
   */
  readonly identifier: boolean;

  /**
   * derived defines whether this field has been derived from another field.
   *
   * Since derived fields are computed from other fields, they can't be
   * modified.
   */
  readonly derived: boolean;
}

export enum DataFieldType {
  String = "string",
  Number = "number",
  Boolean = "boolean",
  Date = "date",
  Link = "link",
  List = "list",
  Unknown = "unknown",
}

export interface DataRecord {
  readonly id: string;
  readonly values: Record<string, OptionalDataValue>;
}

export type DataValue = string | number | boolean | Date | Link | Array<string>;

export type Optional =
  // undefined means the field has been removed from a DataRecord.
  | undefined
  // null means that while the field exists, it doesn't yet have a value.
  | null;

export type OptionalDataValue = DataValue | Optional;

export interface Link {
  readonly displayName?: string;
  readonly linkText: string;
  readonly fullPath?: string;
  readonly sourcePath: string;
}

export const emptyDataFrame: DataFrame = {
  records: [],
  fields: [],
};

/**
 * DataSource reads data frames from a project.
 */
export abstract class DataSource {
  readonly project: ProjectDefinition;

  constructor(project: ProjectDefinition) {
    this.project = project;
  }

  /**
   * queryAll returns a DataFrame with all records in the project.
   */
  abstract queryAll(): Promise<DataFrame>;

  /**
   * queryOne returns a DataFrame with a single record for the given file.
   *
   * @param fields contains existing fields, to be able to parse file into the existing schema.
   */
  abstract queryOne(file: TFile, fields: DataField[]): Promise<DataFrame>;

  /**
   * includes returns whether a path belongs to the current project.
   */
  abstract includes(path: string): boolean;

  /**
   * readonly returns whether the data source is read-only.
   *
   * Read-only data sources are typically derived records where the data
   * source can't determine the original names of the fields.
   */
  readonly(): boolean {
    return false;
  }
}

export function isBoolean(
  value: OptionalDataValue | DataValue
): value is boolean {
  return typeof value === "boolean";
}

export function isString(
  value: OptionalDataValue | DataValue
): value is string {
  return typeof value === "string";
}

export function isList(value: OptionalDataValue | DataValue) {
  return Array.isArray(value);
}

export function isLink(value: OptionalDataValue | DataValue): value is Link {
  if (value && typeof value === "object") {
    return "linkText" in value && "sourcePath" in value;
  }
  return false;
}

export function isNumber(
  value: OptionalDataValue | DataValue
): value is number {
  return typeof value === "number";
}

export function isDate(value: OptionalDataValue | DataValue): value is Date {
  return value instanceof Date;
}

export function hasValue(value: OptionalDataValue): value is DataValue {
  if (typeof value === null || typeof value === undefined) {
    return true;
  }
  return false;
}

export function isOptional(value: unknown): value is Optional {
  return value === null || value === undefined;
}

export function isOptionalBoolean(
  value: OptionalDataValue
): value is boolean | Optional {
  return isBoolean(value) || isOptional(value);
}

export function isOptionalString(
  value: OptionalDataValue
): value is string | undefined {
  return isString(value) || isOptional(value);
}

export function isOptionalLink(
  value: OptionalDataValue
): value is Link | Optional {
  return isLink(value) || isOptional(value);
}

export function isOptionalList(
  value: OptionalDataValue
): value is Array<string> | Optional {
  return isList(value) || isOptional(value);
}

export function isOptionalNumber(
  value: OptionalDataValue
): value is number | Optional {
  return isNumber(value) || isOptional(value);
}

export function isOptionalDate(
  value: OptionalDataValue
): value is Date | Optional {
  return isDate(value) || isOptional(value);
}

export function isStringLink(value: any): boolean {
  if (isString(value)) {
    return /^\[\[(.*)\]\]$/.test(value);
  }
  return false;
}
