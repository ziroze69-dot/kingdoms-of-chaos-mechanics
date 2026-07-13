/**
 * ============================================================
 * KINGDOMS OF CHAOS — Conflict Resolver (Simultaneous Resolution)
 * ============================================================
 *
 * DESIGN: "Snapshot + Priority Bands"
 * ------------------------------------
 * All 4 buffers execute against the SAME logical instant. To make
 * that deterministic we resolve in fixed priority bands. Within a
 * band, actions are order-independent (we pre-compute intents
 * against a snapshot, then apply effects all at once):
 *
 *   Band 1 — CARDS   (instant effects: shields go up, fireballs fly)
 *   Band 2 — BUILDS  (structures appear; traps become armed *this turn*)
 *   Band 3 — ATTACKS (resolved against the post-build board)
 *
 * Why builds before attacks? Per the design spec: a trap built
 * "this turn" must catch an attack planned "this turn". That is the
 * core mind-game of the buffered system — you can bluff-build.
 *
 * CONFLICT RULES IMPLEMENTED:
 * 1. Two+ players attack the SAME tile:
 *    - Tile owner takes damage from every attacker (they all committed).
 *    - Capture is CONTESTED: if one attacker's committed power is
 *      strictly highest (power = number of attack actions that player
 *      aimed at this tile), they capture the tile. On a tie, NOBODY
 *      captures, and all tied attackers take clash damage from
 *      fighting each other over the ruins.
 * 2. Attacking a tile that got a trap built on it THIS turn:
 *    - The trap triggers: attacker takes TRAP_DAMAGE, the attack is
 *      negated (no damage to owner, no capture), and the trap is
 *      consumed. One trap eats ALL attackers of that tile this
 *      resolution (it's a minefield moment).
 * 3. Simultaneous kills are legal: two players can kill each other
 *    in the same resolution (both HP checks happen after all bands).
 * 4. Shields (card) negate ATTACK damage to that player this
 *    resolution, but not trap/clash self-inflicted damage.
 */

import { CARDS, CONFIG, FIREBALL_DAMAGE, GOLD_RUSH_AMOUNT } from './config'
import type { GameAction, GameState, PlayerId, ResolutionEvent } from './types'

interface AttackIntent {
  attacker: PlayerId
  tileId: number
  /** How many attack actions this player committed to this tile. */
  power: number
}

/**
 * Executes every buffered action simultaneously.
 * MUTATES the passed state (callers clone first). Returns the log.
 */
export function resolveAllBuffers(state: GameState): ResolutionEvent[] {
  const log: ResolutionEvent[] = []
  const allActions: GameAction[] = state.players
    .filter((p) => p.isAlive)
    .flatMap((p) => state.buffers[p.id])

  // Players who played Shield this turn (immune to attack/fireball damage).
  const shielded = new Set<PlayerId>()

  // ----------------------------------------------------------
  // BAND 1 — CARDS (instant, order-independent)
  // Defensive cards are read first so a same-turn Shield blocks a
  // same-turn Fireball — "simultaneous" means defense counts.
  // ----------------------------------------------------------
  const cardActions = allActions.filter((a) => a.type === 'PLAY_CARD')

  for (const a of cardActions) {
    if (a.type !== 'PLAY_CARD') continue
    if (a.cardId === 'shield') {
      shielded.add(a.player)
      log.push({ kind: 'card_shield', message: `${name(state, a.player)} raised a Shield.`, players: [a.player] })
    }
  }
  for (const a of cardActions) {
    if (a.type !== 'PLAY_CARD') continue
    if (a.cardId === 'gold_rush') {
      state.players[a.player].gold += GOLD_RUSH_AMOUNT
      log.push({ kind: 'card_gold', message: `${name(state, a.player)} played Gold Rush (+${GOLD_RUSH_AMOUNT}g).`, players: [a.player] })
    }
    if (a.cardId === 'fireball' && a.targetPlayerId !== undefined) {
      const target = state.players[a.targetPlayerId]
      if (shielded.has(target.id)) {
        log.push({ kind: 'card_fireball_blocked', message: `${name(state, a.player)}'s Fireball fizzled on ${target.name}'s Shield!`, players: [a.player, target.id] })
      } else {
        target.hp -= FIREBALL_DAMAGE
        log.push({ kind: 'card_fireball', message: `${name(state, a.player)} hit ${target.name} with Fireball (-${FIREBALL_DAMAGE} HP).`, players: [a.player, target.id] })
      }
    }
  }

  // ----------------------------------------------------------
  // BAND 2 — BUILDS
  // Structures land before any attack resolves. Traps built now
  // are ARMED for Band 3 — this is Conflict Rule #2.
  // Build conflict: two players building on the same neutral tile
  // in the same turn -> both builds fail, gold already spent (the
  // work crews collide). Deterministic and punishes greed.
  // ----------------------------------------------------------
  const buildActions = allActions.filter((a) => a.type === 'BUILD')
  const buildTargets = new Map<number, GameAction[]>()
  for (const a of buildActions) {
    if (a.type !== 'BUILD') continue
    const list = buildTargets.get(a.targetTileId) ?? []
    list.push(a)
    buildTargets.set(a.targetTileId, list)
  }

  for (const [tileId, builds] of buildTargets) {
    const tile = state.tiles[tileId]
    const distinctBuilders = new Set(builds.map((b) => b.player))

    if (distinctBuilders.size > 1) {
      // CONFLICT: rival builds on one tile — everything collapses.
      log.push({ kind: 'build_collision', message: `Rival crews collided on tile ${tileId} — all construction failed!`, players: [...distinctBuilders], tileId })
      continue
    }

    for (const b of builds) {
      if (b.type !== 'BUILD') continue
      tile.owner = b.player // building claims/keeps the tile
      tile.structure = b.structure
      tile.trapArmed = b.structure === 'trap'
      log.push({ kind: 'build', message: `${name(state, b.player)} built a ${b.structure} on tile ${tileId}.`, players: [b.player], tileId })
    }
  }

  // ----------------------------------------------------------
  // BAND 3 — ATTACKS (against the post-build board)
  // Group attacks per tile, then resolve each tile independently.
  // ----------------------------------------------------------
  const attackPower = new Map<string, AttackIntent>() // key: `${player}:${tile}`
  for (const a of allActions) {
    if (a.type !== 'ATTACK') continue
    const key = `${a.player}:${a.targetTileId}`
    const intent = attackPower.get(key) ?? { attacker: a.player, tileId: a.targetTileId, power: 0 }
    intent.power += 1
    attackPower.set(key, intent)
  }

  // Group intents by tile.
  const attacksByTile = new Map<number, AttackIntent[]>()
  for (const intent of attackPower.values()) {
    const list = attacksByTile.get(intent.tileId) ?? []
    list.push(intent)
    attacksByTile.set(intent.tileId, list)
  }

  for (const [tileId, intents] of attacksByTile) {
    const tile = state.tiles[tileId]

    // Attacking your own tile is a wasted action (validated earlier,
    // but the board may have changed in Band 2 — e.g. you captured
    // it via build). Filter those out.
    const valid = intents.filter((i) => tile.owner !== i.attacker)
    if (valid.length === 0) continue

    // --- CONFLICT RULE #2: trap armed on this tile (incl. built this turn) ---
    if (tile.structure === 'trap' && tile.trapArmed) {
      for (const i of valid) {
        state.players[i.attacker].hp -= CONFIG.TRAP_DAMAGE
        log.push({ kind: 'trap_triggered', message: `${name(state, i.attacker)} walked into a trap on tile ${tileId} (-${CONFIG.TRAP_DAMAGE} HP)! Attack negated.`, players: [i.attacker], tileId })
      }
      // Trap is consumed after springing.
      tile.structure = 'none'
      tile.trapArmed = false
      continue // no damage, no capture
    }

    // --- Damage phase: every attacker deals damage to the tile owner ---
    const towerReduction = tile.structure === 'tower' ? CONFIG.TOWER_DEFENSE_BONUS : 0
    if (tile.owner !== null) {
      const owner = state.players[tile.owner]
      for (const i of valid) {
        const dmg = Math.max(0, CONFIG.ATTACK_DAMAGE * i.power - towerReduction)
        if (shielded.has(owner.id)) {
          log.push({ kind: 'attack_blocked', message: `${name(state, i.attacker)}'s attack on tile ${tileId} was blocked by ${owner.name}'s Shield.`, players: [i.attacker, owner.id], tileId })
        } else {
          owner.hp -= dmg
          log.push({ kind: 'attack_hit', message: `${name(state, i.attacker)} attacked tile ${tileId} — ${owner.name} took ${dmg} damage.`, players: [i.attacker, owner.id], tileId })
        }
      }
    }

    // --- CONFLICT RULE #1: capture is contested by committed power ---
    const maxPower = Math.max(...valid.map((i) => i.power))
    const topAttackers = valid.filter((i) => i.power === maxPower)

    if (topAttackers.length === 1) {
      // Unique strongest attacker captures the tile.
      const winner = topAttackers[0]
      tile.owner = winner.attacker
      tile.structure = 'none' // structures are razed on capture
      tile.trapArmed = false
      log.push({ kind: 'tile_captured', message: `${name(state, winner.attacker)} captured tile ${tileId}.`, players: [winner.attacker], tileId })
    } else if (valid.length > 1) {
      // TIE: nobody captures; tied attackers bloody each other.
      for (const i of topAttackers) {
        state.players[i.attacker].hp -= CONFIG.CONTESTED_CLASH_DAMAGE
      }
      log.push({ kind: 'contested_attack', message: `Tile ${tileId} was contested — ${topAttackers.map((i) => name(state, i.attacker)).join(' and ')} clashed (-${CONFIG.CONTESTED_CLASH_DAMAGE} HP each), nobody captured it.`, players: topAttackers.map((i) => i.attacker), tileId })
    }
  }

  // ----------------------------------------------------------
  // POST-RESOLUTION — deaths happen simultaneously
  // ----------------------------------------------------------
  for (const p of state.players) {
    if (p.isAlive && p.hp <= 0) {
      p.hp = 0
      p.isAlive = false
      // Dead kingdoms lose their tiles (become neutral ruins).
      for (const t of state.tiles) {
        if (t.owner === p.id) {
          t.owner = null
          t.structure = 'none'
          t.trapArmed = false
        }
      }
      log.push({ kind: 'player_eliminated', message: `${p.name}'s kingdom has fallen!`, players: [p.id] })
    }
  }

  return log
}

/** Small helper for readable log lines. */
function name(state: GameState, id: PlayerId): string {
  return state.players[id].name
}

export { CARDS }
