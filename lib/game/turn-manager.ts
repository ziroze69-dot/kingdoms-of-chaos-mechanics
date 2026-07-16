/**
 * ============================================================
 * KINGDOMS OF CHAOS — Turn Manager (Phase State Machine)
 * ============================================================
 * [NEW] Added UPGRADE action validation, cost deduction, and refund.
 * UPGRADE effect is immediate (castleLevel++ at buffer time) since it
 * only affects future income, not the current resolution band.
 */

import { CARDS, CONFIG } from './config'
import { resolveAllBuffers } from './conflict-resolver'
import { applyIncome, checkGameOver, cloneState } from './game-state'
import type { GameAction, GameState, PlayerId } from './types'

// ------------------------------------------------------------
// Validation — can this action legally be buffered right now?
// Returns an error string, or null if valid.
// ------------------------------------------------------------
export function validateAction(state: GameState, action: GameAction): string | null {
  const player = state.players[action.player]
  const buffer = state.buffers[action.player]

  if (state.phase !== 'PLANNING') return 'Not in the planning phase.'
  if (state.players[state.activePlayerIndex].id !== action.player) return 'Not your sub-turn.'
  if (!player.isAlive) return 'You have been eliminated.'
  if (buffer.length >= CONFIG.ACTIONS_PER_TURN) return `You already planned ${CONFIG.ACTIONS_PER_TURN} actions.`

  switch (action.type) {
    case 'ATTACK': {
      const tile = state.tiles[action.targetTileId]
      if (!tile) return 'Invalid tile.'
      if (tile.owner === action.player) return 'You cannot attack your own tile.'
      if (player.gold < CONFIG.ATTACK_GOLD_COST) return 'Not enough gold to attack.'
      return null
    }
    case 'BUILD': {
      const tile = state.tiles[action.targetTileId]
      if (!tile) return 'Invalid tile.'
      // You may only build on tiles you own or neutral tiles.
      if (tile.owner !== null && tile.owner !== action.player) return 'You can only build on your own or neutral tiles.'
      if (player.gold < CONFIG.BUILD_COSTS[action.structure]) return 'Not enough gold to build.'
      return null
    }
    case 'PLAY_CARD': {
      if (!player.hand.includes(action.cardId)) return 'Card not in hand.'
      if (player.gold < CARDS[action.cardId].goldCost) return 'Not enough gold for this card.'
      if (action.cardId === 'fireball' && action.targetPlayerId === undefined) return 'Fireball needs a target player.'
      return null
    }
    // [NEW] UPGRADE validation
    case 'UPGRADE': {
      if (player.gold < CONFIG.UPGRADE_COST) return 'Not enough gold to upgrade castle.'
      return null
    }
    case 'PASS':
      return null
  }
}

// ------------------------------------------------------------
// 1 & 2. PLANNING + ACTION BUFFERING
// Adds one action to the active player's SECRET buffer.
// Costs are paid immediately (see design note above).
// ------------------------------------------------------------
export function bufferAction(state: GameState, action: GameAction): GameState {
  const error = validateAction(state, action)
  if (error) throw new Error(error)

  const next = cloneState(state)
  const player = next.players[action.player]

  // Pay costs up-front so the buffer can never overspend.
  switch (action.type) {
    case 'ATTACK':
      player.gold -= CONFIG.ATTACK_GOLD_COST
      break
    case 'BUILD':
      player.gold -= CONFIG.BUILD_COSTS[action.structure]
      break
    case 'PLAY_CARD':
      player.gold -= CARDS[action.cardId].goldCost
      player.hand.splice(player.hand.indexOf(action.cardId), 1) // card leaves hand now (it's committed)
      break
    // [NEW] UPGRADE: deduct gold and immediately increase castle level
    case 'UPGRADE':
      player.gold -= CONFIG.UPGRADE_COST
      player.castleLevel += 1
      break
  }

  next.buffers[action.player].push(action)
  return next
}

/** Remove the LAST buffered action and refund its cost (undo during planning). */
export function unbufferLastAction(state: GameState, playerId: PlayerId): GameState {
  const next = cloneState(state)
  const action = next.buffers[playerId].pop()
  if (!action) return next

  const player = next.players[playerId]
  switch (action.type) {
    case 'ATTACK':
      player.gold += CONFIG.ATTACK_GOLD_COST
      break
    case 'BUILD':
      player.gold += CONFIG.BUILD_COSTS[action.structure]
      break
    case 'PLAY_CARD':
      player.gold += CARDS[action.cardId].goldCost
      player.hand.push(action.cardId)
      break
    // [NEW] Refund upgrade cost and revert castle level
    case 'UPGRADE':
      player.gold += CONFIG.UPGRADE_COST
      player.castleLevel -= 1
      break
  }
  return next
}

// ------------------------------------------------------------
// Sub-turn flow
// ------------------------------------------------------------

/** HANDOFF -> PLANNING: the next player has the device and taps "I'm ready". */
export function beginPlanning(state: GameState): GameState {
  const next = cloneState(state)
  next.phase = 'PLANNING'
  return next
}

/**
 * The active player locks in their (up to 3) actions.
 * Unused slots are auto-filled with PASS so every buffer has
 * exactly ACTIONS_PER_TURN entries — simpler resolution math.
 * Moves to the next alive player, or to RESOLUTION if everyone
 * has committed.
 */
export function commitTurn(state: GameState): GameState {
  if (state.phase !== 'PLANNING') throw new Error('Not in planning phase.')
  const next = cloneState(state)
  const activeId = next.players[next.activePlayerIndex].id

  while (next.buffers[activeId].length < CONFIG.ACTIONS_PER_TURN) {
    next.buffers[activeId].push({ type: 'PASS', player: activeId })
  }

  // Find the next ALIVE player after the current one.
  let idx = next.activePlayerIndex + 1
  while (idx < next.players.length && !next.players[idx].isAlive) idx++

  if (idx < next.players.length) {
    // More players still need to plan -> privacy handoff screen.
    next.activePlayerIndex = idx
    next.phase = 'HANDOFF'
  } else {
    // 3. EXECUTION PHASE — everyone has committed. Resolve simultaneously.
    next.phase = 'RESOLUTION'
    next.lastResolutionLog = resolveAllBuffers(next)
    checkGameOver(next) // records winner; phase flips in acknowledgeResolution
  }
  return next
}

/**
 * RESOLUTION -> next round (or GAME_OVER). Clears buffers, pays
 * income, resets the planner to the first alive player.
 */
export function acknowledgeResolution(state: GameState): GameState {
  const next = cloneState(state)

  // If the last resolution decided the war, end the game now
  // (after the player has seen the final battle report).
  if (checkGameOver(next)) {
    next.phase = 'GAME_OVER'
    return next
  }

  next.buffers = { 0: [], 1: [], 2: [], 3: [] }
  next.round += 1
  applyIncome(next)

  const firstAlive = next.players.findIndex((p) => p.isAlive)
  next.activePlayerIndex = firstAlive
  next.phase = 'HANDOFF'
  return next
}
