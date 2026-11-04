// Fixed display order. Any plan added later comes after these.
const PLAN_ORDER = ['aether-guard', 'quantum-pulse', 'titan-forge'];

function rank(slug: string) {
  const index = PLAN_ORDER.indexOf(slug);
  return index === -1 ? PLAN_ORDER.length : index;
}

export function sortPlans<T extends { slug: string; name: string }>(plans: T[]) {
  return [...plans].sort(
    (a, b) => rank(a.slug) - rank(b.slug) || a.name.localeCompare(b.name),
  );
}
