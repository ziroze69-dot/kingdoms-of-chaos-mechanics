/**
 * ============================================================
 * KINGDOMS OF CHAOS — Conflict Resolver (Simultaneous Resolution)
 * ============================================================
 * NOTE: No structural changes needed. RECRUIT and UPGRADE actions
 * are self-resolved during buffering (costs paid, effects applied
 * immediately), so they do not appear in resolution bands.
 */

import { CARDS, CONFIG, FIREBALL_DAMAGE, GOLD_RUSH_AMOUNT } from './config'
import type { GameAction, GameState, PlayerId, ResolutionEvent } from './types'

interface AttackIntent {
  attacker: PlayerId
  tileId: number
  power: number
}

export function resolveAllBuffers(state: GameState): ResolutionEvent[] {
  const log: ResolutionEvent[] = []
  const allActions: GameAction[] = state.players
    .filter((p) => p.isAlive)
    .flatMap((p) => state.buffers[p.id])

  const shielded = new Set<PlayerId>()

  // BAND 1 — CARDS
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

  // BAND 2 — BUILDS
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
      log.push({ kind: 'build_collision', message: `Rival crews collided on tile ${tileId} — all construction failed!`, players: [...distinctBuilders], tileId })
      continue
    }

    for (const b of builds) {
      if (b.type !== 'BUILD') continue
      tile.owner = b.player
      tile.structure = b.structure
      tile.trapArmed = b.structure === 'trap'
      log.push({ kind: 'build', message: `${name(state, b.player)} built a ${b.structure} on tile ${tileId}.`, players: [b.player], tileId })
    }
  }

  // BAND 3 — ATTACKS
  const attackPower = new Map<string, AttackIntent>()
  for (const a of allActions) {
    if (a.type !== 'ATTACK') continue
    const key = `${a.player}:${a.targetTileId}`
    const intent = attackPower.get(key) ?? { attacker: a.player, tileId: a.targetTileId, power: 0 }
    intent.power += 1
    attackPower.set(key, intent)
  }

  const attacksByTile = new Map<number, AttackIntent[]>()
  for (const intent of attackPower.values()) {
    const list = attacksByTile.get(intent.tileId) ?? []
    list.push(intent)
    attacksByTile.set(intent.tileId, list)
  }

  for (const [tileId, intents] of attacksByTile) {
    const tile = state.tiles[tileId]
    const valid = intents.filter((i) => tile.owner !== i.attacker)
    if (valid.length === 0) continue

    if (tile.structure === 'trap' && tile.trapArmed) {
      for (const
