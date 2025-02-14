import { stringify } from "yaml";
import { parseYaml } from "./decode";

/**
 * encodeFrontMatter updates the front matter of a note.
 *
 * @param data is the current content of the note, including front matter.
 * @param frontmatter is the front matter to add to the note.
 * @returns data with the updated front matter.
 */
export function encodeFrontMatter(
  data: string,
  frontmatter: Record<string, any>
): string {
  const delim = "---";

  const startPosition = data.indexOf(delim) + delim.length;
  const endPosition = data.slice(startPosition).indexOf(delim) + startPosition;

  const isStart = data.slice(0, startPosition).trim() === delim;
  const hasFrontMatter = isStart && endPosition > startPosition;

  const existing = parseYaml(data.slice(startPosition, endPosition));

  const fm = Object.assign({}, existing, frontmatter);

  if (Object.entries(fm).length) {
    return hasFrontMatter
      ? data.slice(0, startPosition + 1) +
          stringifyYaml(fm) +
          data.slice(endPosition)
      : delim + "\n" + stringifyYaml(fm) + delim + "\n\n" + data;
  }

  return hasFrontMatter
    ? data.slice(0, startPosition - delim.length) +
        data.slice(endPosition + delim.length + 1)
    : data;
}

/**
 * stringifyYaml converts a value to YAML.
 */
export function stringifyYaml(value: any): string {
  return postprocessYaml(stringify(value, { lineWidth: 0, nullStr: "" }));
}

/**
 * postprocessYaml removes quotes from single-line string properties.
 */
function postprocessYaml(value: string): string {
  const illegalCharacters = /[:|\-]\s/;
  const quotedProperties = /^(.*):\s*"(.*)"$/gm;

  return value.replace(quotedProperties, (_match, key, value) => {
    if (illegalCharacters.test(value)) {
      return `${key}: "${value}"`;
    }
    return `${key}: ${value}`;
  });
}
