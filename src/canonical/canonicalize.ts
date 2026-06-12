import {
  type Component,
  type TechniqueStep,
  LIQUID_BUILD_ROLES,
  IDENTITY_AFFECTING_TECHNIQUES,
} from '../types';

export function canonicalize(
  components: Component[],
  techniques: TechniqueStep[] = [],
): string {
  const liquid = components
    .filter((c) => LIQUID_BUILD_ROLES.has(c.role))
    .map((c) => `${c.role}:${c.ingredientId}`)
    .sort();

  const idTech = techniques
    .filter((t) => IDENTITY_AFFECTING_TECHNIQUES.has(t.verb))
    .map((t) => t.verb)
    .sort();

  return `C[${liquid.join(',')}]|T[${idTech.join(',')}]`;
}
