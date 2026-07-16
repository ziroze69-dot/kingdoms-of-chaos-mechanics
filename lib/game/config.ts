/**
 * ============================================================
 * KINGDOMS OF CHAOS — Tunable Game Constants
 * ============================================================
 * [CHANGED] BOARD_SIZE unified to 36 (6x6) to match design doc.
 * [NEW] Added troop system and castle upgrade economy.
 */

import type { CardDef, CardId } from './types'

export const CONFIG = {
  PLAYER_COUNT: 4,
  ACTIONS_PER_TURN: 3,

  STARTING_HP: 20,
  STARTING_GOLD: 10,
  // [NEW] Military resource for AI attack decisions
  STARTING_TROOPS: 5,
  // [NEW] Castle level controls troop income and represents kingdom development
  STARTING_CASTLE_LEVEL: 1,

  // [CHANGED] 6x6 grid (was 16 / 4x4). Corners updated in game-state.ts to [0, 5, 30, 35].
  BOARD_SIZE: 36,

  // --- Costs ---
  ATTACK_GOLD_COST: 1,
  BUILD_COSTS: { farm: 2, tower: 3, trap: 2 } as const,
  // [NEW] Upgrade cost tuned to current economy (was 50 in original concept, scaled down
  // because starting gold is 10 and base income is ~3-5 per round).
  UPGRADE_COST: 8,

  // --- Combat ---
  ATTACK_DAMAGE: 3,
  TOWER_DEFENSE_BONUS: 2,
  TRAP_DAMAGE: 4,
  CONTESTED_CLASH_DAMAGE: 2,

  // --- Economy ---
  GOLD_PER_ROUND: 3,
  GOLD_PER_FARM: 1,
  // [NEW] Troop recruitment every round
  TROOPS_PER_ROUND: 2,
  // [NEW] Extra troops per castle level (incentive to upgrade)
  TROOPS_PER_CASTLE_LEVEL: 1,
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
