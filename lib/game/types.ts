/**
 * ============================================================
 * KINGDOMS OF CHAOS — Core Type Definitions
 * ============================================================
 * Engine-agnostic. No React / DOM / engine imports here, so you
 * can lift this entire `lib/game` folder into Unity (via a TS->C#
 * port), Godot, Phaser, React Native, etc.
 */

// ------------------------------------------------------------
// Players
// ------------------------------------------------------------

export type PlayerId = 0 | 1 | 2 | 3

export interface Player {
  id: PlayerId
  name: string
  isBot: boolean
  hp: number
  gold: number
  /** Cards currently in hand (card ids). */
  hand: CardId[]
  /** Dead players are skipped during planning and ignored at resolution. */
  isAlive: boolean
}

// ------------------------------------------------------------
// Board
// ------------------------------------------------------------

export type StructureType = 'none' | 'farm' | 'tower' | 'trap'

export interface Tile {
  id: number
  /** null = neutral / unowned */
  owner: PlayerId | null
  structure: StructureType
  /**
   * Hidden information: traps are only visible to their builder
   * until they trigger. The UI layer decides what to reveal.
   */
  trapArmed: boolean
}

// ------------------------------------------------------------
// Cards (minimal example set — extend freely)
// ------------------------------------------------------------

export type CardId = 'fireball' | 'shield' | 'gold_rush'

export interface CardDef {
  id: CardId
  name: string
  goldCost: number
  description: string
}

// ------------------------------------------------------------
// Actions — the atoms that get buffered and resolved
// ------------------------------------------------------------

export type GameAction =
  | { type: 'ATTACK'; player: PlayerId; targetTileId: number }
  | { type: 'BUILD'; player: PlayerId; targetTileId: number; structure: Exclude<StructureType, 'none'> }
  | { type: 'PLAY_CARD'; player: PlayerId; cardId: CardId; targetPlayerId?: PlayerId }
  | { type: 'PASS'; player: PlayerId } // explicit "skip this action slot"

// ------------------------------------------------------------
// Turn phases
// ------------------------------------------------------------

export type GamePhase =
  | 'PLANNING'   // players take secret sub-turns, buffering actions
  | 'HANDOFF'    // "pass the device" privacy screen between sub-turns
  | 'RESOLUTION' // all buffers execute simultaneously
  | 'GAME_OVER'

// ------------------------------------------------------------
// Resolution log — lets the UI replay what happened
// ------------------------------------------------------------

export interface ResolutionEvent {
  /** Machine-readable kind, e.g. 'attack_hit', 'trap_triggered', 'contested_attack' */
  kind: string
  /** Human-readable summary for the battle-report UI. */
  message: string
  /** Players involved (for highlighting / animations). */
  players: PlayerId[]
  /** Tile involved, if any. */
  tileId?: number
}

// ------------------------------------------------------------
// Root game state — a single serializable object.
// Everything the game "is" lives here (easy save/load, undo,
// networking later, deterministic replays).
// ------------------------------------------------------------

export interface GameState {
  phase: GamePhase
  round: number
  players: Player[]
  tiles: Tile[]
  /** Index into `players` of whoever is currently planning. */
  activePlayerIndex: number
  /**
   * THE ACTION BUFFER.
   * Keyed by player id. Actions are stored here secretly during
   * planning and only executed during RESOLUTION.
   */
  buffers: Record<PlayerId, GameAction[]>
  /** Battle report from the most recent resolution phase. */
  lastResolutionLog: ResolutionEvent[]
  winner: PlayerId | null
}
