import { formatLabel } from "./forms.util";

export function enumToOptions<T extends Record<string, string>>(enumObj: T) {
  return Object.values(enumObj).map(value => ({
    value,
    label: formatLabel(value),
  }));
}
