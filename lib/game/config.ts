/**
 * ============================================================
 * KINGDOMS OF CHAOS — Tunable Game Constants
 * ============================================================
 * All balance numbers live here so designers can tweak without
 * touching logic.
 */

import type { CardDef, CardId } from './types'

export const CONFIG = {
  PLAYER_COUNT: 4,
  ACTIONS_PER_TURN: 3,

  STARTING_HP: 20,
  STARTING_GOLD: 10,

  BOARD_SIZE: 16, // 4x4 grid

  // --- Costs ---
  ATTACK_GOLD_COST: 1,
  BUILD_COSTS: { farm: 2, tower: 3, trap: 2 } as const,

  // --- Combat ---
  ATTACK_DAMAGE: 3,        // damage dealt to a tile's owner on a successful hit
  TOWER_DEFENSE_BONUS: 2,  // reduces incoming attack damage on that tile
  TRAP_DAMAGE: 4,          // reflected onto an attacker who hits a trapped tile
  CONTESTED_CLASH_DAMAGE: 2, // damage each attacker takes when tying on the same tile

  // --- Economy ---
  GOLD_PER_ROUND: 3,       // base income at the start of each planning phase
  GOLD_PER_FARM: 1,        // extra income per owned farm
} as const

export const CARDS: Record<CardId, CardDef> = {
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    goldCost: 3,
    description: 'Deal 4 damage directly to a target player.',
  },
  shield: {
    id: 'shield',
    name: 'Shield',
    goldCost: 2,
    description: 'Negate all attack damage you would take this resolution.',
  },
  gold_rush: {
    id: 'gold_rush',
    name: 'Gold Rush',
    goldCost: 0,
    description: 'Gain 3 gold.',
  },
}

export const FIREBALL_DAMAGE = 4
export const GOLD_RUSH_AMOUNT = 3
