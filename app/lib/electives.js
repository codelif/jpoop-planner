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
    selection[cat] = ELECTIVE_NONE;
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
    const val = selection?.[cat];

    if (val === ELECTIVE_NONE) {
      normalized[cat] = ELECTIVE_NONE;
      continue;
    }

    if (typeof val === "string" && options.includes(val)) {
      normalized[cat] = val;
    } else {
      normalized[cat] = ELECTIVE_NONE;
    }
  }
  return normalized;
}

export function hasAnyElectiveSelected(selection = {}) {
  return Object.values(selection).some((v) => v && v !== ELECTIVE_NONE);
}

export function filterClassItemByElectives(item, selectedByCategory = {}) {
  if (!item?.is_elective) return true;

  const code = item.subjectcode || item.subject;
  if (!code) return false;

  const category = item.category;

  // If the item has a category, it must match that category's chosen code.
  if (
    category &&
    Object.prototype.hasOwnProperty.call(selectedByCategory, category)
  ) {
    return selectedByCategory[category] === code;
  }

  // Fallback: if category is missing/unexpected, allow only if code is chosen somewhere.
  const chosenCodes = new Set(
    Object.values(selectedByCategory).filter((v) => v && v !== ELECTIVE_NONE),
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
