export const ELECTIVE_NONE = "__ELECTIVE_NONE__";

export function electiveComboKey(course, semester, phase) {
  return `${course}_${semester}_${phase}`;
}

export function electivesDefStorageKey(course, semester, phase) {
  return `electivesDef_${electiveComboKey(course, semester, phase)}`;
}

export function electivesSelStorageKey(course, semester, phase) {
  return `electivesSel_${electiveComboKey(course, semester, phase)}`;
}

export function buildDefaultElectiveSelection(electivesByCategory = {}) {
  const selection = {};
  for (const cat of Object.keys(electivesByCategory || {})) {
    selection[cat] = [];
  }
  return selection;
}

export function normalizeElectiveSelection(
  selection,
  electivesByCategory = {},
) {
  const normalized = {};
  const cats = Object.keys(electivesByCategory || {});
  for (const cat of cats) {
    const options = Array.isArray(electivesByCategory[cat])
      ? electivesByCategory[cat]
      : [];
    const saved = selection?.[cat];
    // Migrate the previous single-value format while loading persisted choices.
    const values = Array.isArray(saved)
      ? saved
      : typeof saved === "string" && saved !== ELECTIVE_NONE
        ? [saved]
        : [];

    normalized[cat] = [...new Set(values)].filter(
      (value) => typeof value === "string" && options.includes(value),
    );
  }
  return normalized;
}

export function hasAnyElectiveSelected(selection = {}) {
  return Object.values(selection).some((values) =>
    Array.isArray(values)
      ? values.length > 0
      : values && values !== ELECTIVE_NONE,
  );
}

export function filterClassItemByElectives(item, selectedByCategory = {}) {
  if (!item?.is_elective) return true;

  const code = item.subject || item.subjectcode;
  if (!code) return false;

  const category = item.category;

  const isCodeSelected = (selected) =>
    Array.isArray(selected) ? selected.includes(code) : selected === code;

  // If the item has a category, it must be selected in that category.
  if (
    category &&
    Object.prototype.hasOwnProperty.call(selectedByCategory, category)
  ) {
    return isCodeSelected(selectedByCategory[category]);
  }

  // Fallback: if category is missing/unexpected, allow only if code is chosen somewhere.
  const chosenCodes = new Set(
    Object.values(selectedByCategory).flatMap((values) => {
      if (Array.isArray(values)) return values;
      return values && values !== ELECTIVE_NONE ? [values] : [];
    }),
  );
  return chosenCodes.has(code);
}

export function filterWeekByElectives(week = {}, selectedByCategory = {}) {
  const out = {};
  for (const [day, list] of Object.entries(week || {})) {
    const arr = Array.isArray(list) ? list : [];
    out[day] = arr.filter((item) =>
      filterClassItemByElectives(item, selectedByCategory),
    );
  }
  return out;
}
