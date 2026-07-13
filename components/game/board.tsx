'use client'

/**
 * Board — renders the 4x4 tile grid.
 * Hidden info rule: traps are only rendered for `viewerId` (their builder).
 */

import { cn } from '@/lib/utils'
import type { PlayerId, Tile } from '@/lib/game/types'

const PLAYER_COLORS: Record<PlayerId, string> = {
  0: 'bg-chart-1/80 text-primary-foreground',
  1: 'bg-chart-2/80 text-primary-foreground',
  2: 'bg-chart-3/80 text-primary-foreground',
  3: 'bg-chart-4/80 text-primary-foreground',
}

const STRUCTURE_LABELS: Record<string, string> = {
  farm: 'Farm',
  tower: 'Tower',
  trap: 'Trap',
}

export function Board({
  tiles,
  viewerId,
  selectedTileId,
  onSelectTile,
}: {
  tiles: Tile[]
  /** Whose eyes are we rendering for? Traps of other players stay hidden. */
  viewerId: PlayerId | null
  selectedTileId: number | null
  onSelectTile?: (tileId: number) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5" role="grid" aria-label="Game board">
      {tiles.map((tile) => {
        // Secret info: only show a trap to the player who owns it.
        const showTrap = tile.structure === 'trap' && tile.owner === viewerId
        const visibleStructure = tile.structure === 'trap' && !showTrap ? 'none' : tile.structure

        return (
          <button
            key={tile.id}
            type="button"
            onClick={() => onSelectTile?.(tile.id)}
            disabled={!onSelectTile}
            aria-label={`Tile ${tile.id}${tile.owner !== null ? `, owned by player ${tile.owner + 1}` : ', neutral'}`}
            className={cn(
              'flex aspect-square flex-col items-center justify-center rounded-md border text-xs font-medium transition-colors',
              tile.owner !== null ? PLAYER_COLORS[tile.owner] : 'bg-muted text-muted-foreground',
              selectedTileId === tile.id && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
              onSelectTile && 'hover:opacity-80',
            )}
          >
            <span className="font-mono">{tile.id}</span>
            {visibleStructure !== 'none' && (
              <span className="text-[10px] leading-tight">{STRUCTURE_LABELS[visibleStructure]}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
