import { describe, it, expect } from 'vitest';
import {
  LIQUID_BUILD_ROLES,
  IDENTITY_AFFECTING_TECHNIQUES,
  type Component,
  type Cocktail,
} from '../src/types';

describe('domain constants', () => {
  it('liquid-build roles exclude garnish', () => {
    expect(LIQUID_BUILD_ROLES.has('base')).toBe(true);
    expect(LIQUID_BUILD_ROLES.has('lengthener')).toBe(true);
    expect(LIQUID_BUILD_ROLES.has('garnish')).toBe(false);
  });

  it('identity-affecting techniques include smoke but not stir', () => {
    expect(IDENTITY_AFFECTING_TECHNIQUES.has('smoke')).toBe(true);
    expect(IDENTITY_AFFECTING_TECHNIQUES.has('muddle')).toBe(true);
    expect(IDENTITY_AFFECTING_TECHNIQUES.has('stir')).toBe(false);
  });

  it('constructs a Cocktail value', () => {
    const c: Component = { ingredientId: 'gin', role: 'base', bucket: 'full' };
    const ck: Cocktail = {
      id: 'negroni',
      name: 'Negroni',
      aliases: [],
      components: [c],
      techniques: [{ seq: 1, verb: 'stir' }],
      glass: 'rocks',
      ice: 'large',
    };
    expect(ck.components[0].ingredientId).toBe('gin');
  });
});
