import { cellKey, cellsInGrid, hexOf, planGridOps } from '@/lib/scene-grid'
import type { OutboxOp } from './ops'
import type { OfflineScene, OfflineSpecimen, OrgSnapshot } from './types'

/** How a plant added offline is shown until hortlog has it: the name typed, or the species chosen. */
export function unidentifiedSpecies(fieldName: string | null): OfflineSpecimen['species'] {
  return {
    commonName: fieldName ?? 'Unidentified plant',
    scientificName: fieldName ?? 'Unidentified',
    authority: null,
    family: null,
    origin: null,
    description: null,
    photoUrl: null,
    status: null,
  }
}

/**
 * The saved copy with the member's unsent changes laid over it, so what they
 * did offline shows straight away, marked as waiting to send.
 */
export function applyPending(snap: OrgSnapshot, ops: OutboxOp[]): OrgSnapshot {
  const mine = ops.filter((op) => op.org === snap.org.slug && !op.error)
  if (mine.length === 0) return snap

  const tasks = snap.tasks.map((t) => ({ ...t }))
  let records = snap.myRecords.map((r) => ({ ...r, entries: [...r.entries] }))
  let specimens: OfflineSpecimen[] = snap.specimens.map((s) => ({ ...s }))
  const scenes: OfflineScene[] = snap.scenes.map((s) => ({ ...s, splitCells: [...(s.splitCells ?? [])] }))

  const findSpecimen = (id: string) => specimens.find((s) => s.id === id)
  const inScene = (sceneId: string) => specimens.filter((s) => s.sceneId === sceneId && s.gridCell)

  for (const op of mine) {
    switch (op.kind) {
      case 'setTaskStatus': {
        const t = tasks.find((x) => x.id === op.taskId)
        if (!t) break
        t.status = op.status
        t.completedAt = op.status === 'DONE' ? op.createdAt : null
        t.pending = true
        break
      }

      case 'setStage': {
        const specimen = findSpecimen(op.specimenId)
        if (!specimen) break
        specimen.stage = op.stage
        specimen.stageSeenAt = op.createdAt
        break
      }

      case 'recordWork': {
        const specimen = findSpecimen(op.specimenId)
        if (!specimen) break
        const entry = {
          id: op.id,
          date: new Date(`${op.entry.date}T12:00:00`).toISOString(),
          action: op.entry.action,
          actionNote: op.entry.actionNote,
          location: op.entry.location,
          text: op.entry.text,
          pending: true,
        }
        const record = records.find((r) => r.specimenId === op.specimenId)
        if (record) {
          record.entries = [entry, ...record.entries].sort((a, b) => b.date.localeCompare(a.date))
        } else {
          records = [
            ...records,
            {
              id: `pending-${op.id}`,
              recordNumber: 0,
              specimenId: op.specimenId,
              scientificName: specimen.species.scientificName,
              firstWorkedDate: entry.date,
              entries: [entry],
              pending: true,
            },
          ]
        }
        break
      }

      case 'createSpecimen': {
        if (findSpecimen(op.specimenId)) break
        const known = op.speciesId ? snap.speciesList?.find((s) => s.id === op.speciesId) : undefined
        specimens = [
          ...specimens,
          {
            id: op.specimenId,
            slug: op.specimenId,
            cultivar: null,
            accessionNumber: op.accessionNumber,
            notes: op.notes,
            imageUrl: null,
            sceneId: null,
            gridCell: null,
            collectionIds: [],
            species: known
              ? { ...unidentifiedSpecies(null), commonName: known.commonName, scientificName: known.scientificName }
              : unidentifiedSpecies(op.fieldName),
            pending: true,
          },
        ]
        break
      }

      case 'placeSpecimen': {
        const s = findSpecimen(op.specimenId)
        if (!s) break
        const cell = cellKey(op.row, op.col, op.sub)
        const hex = cellKey(op.row, op.col)
        // The cell's current plant comes off the grid, and a big plant gives up the hex, as on the server
        for (const other of specimens) {
          if (other.id === s.id || other.sceneId !== op.sceneId) continue
          if (other.gridCell === cell) {
            other.sceneId = null
            other.gridCell = null
            other.extraCells = []
          } else if (other.extraCells?.includes(hex)) other.extraCells = other.extraCells.filter((c) => c !== hex)
        }
        s.sceneId = op.sceneId
        s.gridCell = cell
        s.extraCells = []
        s.pending = true
        break
      }

      case 'placeOnPhoto': {
        const s = findSpecimen(op.specimenId)
        if (!s) break
        if (s.sceneId !== op.sceneId) {
          s.gridCell = null
          s.extraCells = []
        }
        s.sceneId = op.sceneId
        s.photoX = op.x
        s.photoY = op.y
        s.pending = true
        break
      }

      case 'unplaceSpecimen': {
        const s = findSpecimen(op.specimenId)
        if (!s) break
        s.sceneId = null
        s.gridCell = null
        s.extraCells = []
        s.photoX = null
        s.photoY = null
        s.pending = true
        break
      }

      case 'splitHex': {
        const scene = scenes.find((x) => x.id === op.sceneId)
        if (!scene) break
        const hex = cellKey(op.row, op.col)
        const split = scene.splitCells ?? []
        const inHex = inScene(scene.id).filter((s) => hexOf(s.gridCell) === hex)
        if (op.split) {
          if (!split.includes(hex)) scene.splitCells = [...split, hex]
          for (const s of inScene(scene.id)) if (s.extraCells?.includes(hex)) s.extraCells = s.extraCells.filter((c) => c !== hex)
          for (const s of inHex) if (s.gridCell === hex) s.gridCell = cellKey(op.row, op.col, 0)
        } else {
          if (inHex.length > 1) break
          scene.splitCells = split.filter((c) => c !== hex)
          for (const s of inHex) s.gridCell = hex
        }
        scene.pending = true
        break
      }

      case 'resizeGrid': {
        const scene = scenes.find((x) => x.id === op.sceneId)
        if (!scene) break
        const placed = inScene(scene.id)
        const plan = planGridOps(
          { rows: scene.gridRows, cols: scene.gridCols, rowShift: scene.rowShift },
          op.steps,
          placed.flatMap((s) => [s.gridCell, ...(s.extraCells ?? [])]),
        )
        if (!plan.ok) break
        scene.gridRows = plan.shape.rows
        scene.gridCols = plan.shape.cols
        scene.rowShift = plan.shape.rowShift
        scene.splitCells = (scene.splitCells ?? []).map(plan.moveCell).filter((c): c is string => c !== null)
        scene.blockedCells = cellsInGrid((scene.blockedCells ?? []).map(plan.moveCell), scene.gridRows, scene.gridCols)
        for (const s of placed) {
          const moved = plan.moveCell(s.gridCell as string)
          if (s.extraCells?.length) s.extraCells = cellsInGrid(s.extraCells.map(plan.moveCell), scene.gridRows, scene.gridCols)
          if (moved) s.gridCell = moved
          else {
            s.sceneId = null
            s.gridCell = null
          }
        }
        scene.pending = true
        break
      }

      case 'updateScene': {
        const scene = scenes.find((x) => x.id === op.sceneId)
        if (!scene) break
        if (op.active !== undefined) scene.active = op.active
        if (op.title !== undefined) scene.title = op.title
        scene.pending = true
        break
      }
    }
  }

  return { ...snap, tasks, myRecords: records, specimens, scenes }
}
