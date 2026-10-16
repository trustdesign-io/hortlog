'use client'
/* eslint-disable @next/next/no-html-link-for-pages -- plain links on purpose: the offline app handles clicks itself and must never ask the server */

import { useState, type ReactNode } from 'react'
import { HexGrid, HexOutline, HexPlantLabel, HexSubCells } from '@/components/hex-grid'
import { cellKey, cellLabel, hexOf } from '@/lib/scene-grid'
import { ScientificName } from '@/components/ui/scientific-name'
import { sceneCellScale, sceneTilt } from '@/lib/scene-perspective'
import { WORK_ACTION_LABELS } from '@/lib/work-action-labels'
import {
  specimenPhoto,
  type OfflineScene,
  type OfflineSpecimen,
  type OfflineTask,
  type OfflineWorkRecord,
  type OrgSnapshot,
} from '@/lib/offline/types'
import type { OfflineRoute } from '@/lib/offline/routes'
import type { OutboxOp } from '@/lib/offline/ops'
import { applyPending } from '@/lib/offline/pending'
import { OutboxList, RecordWorkPanel, TaskToggle, WaitingBadge } from './offline-actions'
import { Photo } from './offline-photo'
import { OfflineSceneEditor } from './offline-scene-editor'
import { cn } from '@/lib/utils'
import type { WorkAction } from '@prisma/client'

const CELL_WIDTH_REM = 6
const PX_PER_REM = 16

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function actionLabel(action: string | null): string | null {
  return action ? (WORK_ACTION_LABELS[action as WorkAction] ?? action) : null
}

function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{children}</p>
}

function SpecimenRow({ s, org }: { s: OfflineSpecimen; org: string }) {
  return (
    <li>
      <a href={`/${org}/specimens/${s.id}`} className="flex min-h-14 items-center gap-3 rounded-lg p-2 hover:bg-muted">
        <Photo src={specimenPhoto(s)} className="h-12 w-12 shrink-0 rounded-md" />
        <span className="min-w-0">
          <ScientificName className="block truncate">{s.species.scientificName}</ScientificName>
          <span className="block truncate text-sm text-muted-foreground">
            {[s.species.commonName, s.cultivar && `‘${s.cultivar}’`, s.accessionNumber].filter(Boolean).join(' · ')}
          </span>
        </span>
      </a>
    </li>
  )
}

function TaskRow({ t, snap }: { t: OfflineTask; snap: OrgSnapshot }) {
  const overdue = t.status === 'OPEN' && t.dueDate !== null && Date.parse(t.dueDate) < startOfToday()
  const specimen = t.specimenId ? snap.specimens.find((s) => s.id === t.specimenId) : undefined
  const scene = t.sceneId ? snap.scenes.find((s) => s.id === t.sceneId) : undefined
  return (
    <li className="flex gap-3 rounded-lg border p-3">
      {snap.user.canManage && <TaskToggle task={t} org={snap.org.slug} />}
      <div className="min-w-0 flex-1 space-y-1">
      <p className={cn('font-medium', t.status === 'DONE' && 'text-muted-foreground line-through')}>{t.title}</p>
      {t.pending && <WaitingBadge />}
      {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {t.dueDate && <span className={cn(overdue && 'font-medium text-destructive')}>{overdue ? 'Overdue · ' : 'Due '}{formatDate(t.dueDate)}</span>}
        {t.completedAt && <span>Done {formatDate(t.completedAt)}</span>}
        {actionLabel(t.careAction) && <span>{actionLabel(t.careAction)}</span>}
        {specimen && (
          <a href={`/${snap.org.slug}/specimens/${specimen.id}`} className="underline underline-offset-2">
            <ScientificName>{specimen.species.scientificName}</ScientificName>
          </a>
        )}
        {scene && (
          <a href={`/${snap.org.slug}/scenes/${scene.id}`} className="underline underline-offset-2">
            {scene.name}
            {t.cells.length > 0 && ` (${t.cells.length} cell${t.cells.length === 1 ? '' : 's'})`}
          </a>
        )}
        {t.assignees.length > 0 && <span>{t.assignees.join(', ')}</span>}
      </p>
      </div>
    </li>
  )
}

function recordTitle(r: OfflineWorkRecord): string {
  return r.pending ? 'My record (new)' : `My record #${r.recordNumber}`
}

function RecordNumber({ r }: { r: OfflineWorkRecord }) {
  return <span className="mr-2 text-muted-foreground tabular-nums">{r.pending ? 'New' : `#${r.recordNumber}`}</span>
}

function RecordEntries({ record }: { record: OfflineWorkRecord }) {
  if (record.entries.length === 0) return <Empty>No entries yet.</Empty>
  return (
    <ol className="space-y-2">
      {record.entries.map((e) => (
        <li key={e.id} className="rounded-lg border p-3 text-sm">
          <p className="font-medium">
            {formatDate(e.date)} · {actionLabel(e.action)}
            {e.actionNote && <span className="font-normal text-muted-foreground"> – {e.actionNote}</span>}
          </p>
          {e.pending && <WaitingBadge className="mt-1" />}
          {e.location && <p className="text-muted-foreground">{e.location}</p>}
          {e.text && <p className="mt-1 whitespace-pre-line">{e.text}</p>}
        </li>
      ))}
    </ol>
  )
}

function SceneGrid({ scene, snap }: { scene: OfflineScene; snap: OrgSnapshot }) {
  const byCell = new Map<string, OfflineSpecimen>()
  const split = new Set(scene.splitCells ?? [])
  for (const s of snap.specimens) {
    if (s.sceneId !== scene.id || !s.gridCell) continue
    byCell.set(s.gridCell, s)
    if (s.gridCell.includes(':')) split.add(hexOf(s.gridCell) ?? '')
  }
  if (scene.gridRows <= 0 || scene.gridCols <= 0) return null
  const tilt = sceneTilt(scene.perspective, scene.gridRows, CELL_WIDTH_REM * PX_PER_REM)
  return (
    <div className="overflow-x-auto pb-4" role="region" aria-label="Specimen grid">
      <HexGrid
        className="mx-auto"
        rows={scene.gridRows}
        cols={scene.gridCols}
        cellWidth={`${CELL_WIDTH_REM * sceneCellScale(scene.gridRows, tilt)}rem`}
        tiltDeg={tilt}
        rowShift={scene.rowShift}
        hiddenCells={scene.blockedCells}
        renderCell={(row, col, style) => {
          const cell = `${row},${col}`
          const s = byCell.get(cell)
          if (split.has(cell)) {
            return (
              <div key={cell} className="hex-cell" style={style}>
                <span className="hex-shape block bg-muted/30">
                  <HexOutline className="text-border/60" />
                  <HexSubCells
                    renderSub={(sub, subStyle) => {
                      const key = cellKey(row, col, sub)
                      const p = byCell.get(key)
                      return p ? (
                        <a
                          key={key}
                          href={`/${snap.org.slug}/specimens/${p.id}`}
                          className="hex-sub bg-muted"
                          style={subStyle}
                          aria-label={`${p.species.scientificName}, ${cellLabel(key)}`}
                        >
                          <Photo src={specimenPhoto(p)} className="absolute inset-0 h-full w-full" />
                        </a>
                      ) : (
                        <span key={key} className="hex-sub" style={subStyle} aria-hidden="true">
                          <HexOutline className="text-border/60" />
                        </span>
                      )
                    }}
                  />
                </span>
              </div>
            )
          }
          if (s) {
            return (
              <a
                key={cell}
                href={`/${snap.org.slug}/specimens/${s.id}`}
                className="hex-cell group"
                style={style}
                aria-label={`${s.species.scientificName}, row ${row + 1}, column ${col + 1}`}
              >
                <span className="hex-shape relative block bg-muted group-hover:opacity-80">
                  <Photo src={specimenPhoto(s)} className="absolute inset-0 h-full w-full" />
                  <HexPlantLabel scientificName={s.species.scientificName} />
                </span>
              </a>
            )
          }
          return (
            <div key={cell} className="hex-cell" style={style} aria-hidden="true">
              <span className="hex-shape block bg-muted/50">
                <HexOutline className="text-border/60" />
              </span>
            </div>
          )
        }}
      />
    </div>
  )
}

const NAV = [
  ['', 'Overview'],
  ['/specimens', 'Specimens'],
  ['/collections', 'Collections'],
  ['/scenes', 'Scenes'],
  ['/todo', 'To do'],
] as const

function Chrome({
  snap,
  active,
  children,
}: {
  snap: OrgSnapshot | null
  active: string | null
  children: ReactNode
}) {
  return (
    <>
      <header className="border-b px-4 pt-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <a href="/records" className="font-heading text-lg font-semibold">
            hortlog
          </a>
          <a href="/records" className={cn('text-sm', active === 'record' ? 'font-medium' : 'text-muted-foreground')}>
            My record
          </a>
        </div>
        {snap && (
          <>
            <p className="mt-2 truncate text-sm font-medium">{snap.org.name}</p>
            <nav aria-label="Organisation" className="-mx-4 mt-1 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6">
              <ul className="flex gap-1">
                {NAV.map(([suffix, label]) => (
                  <li key={label}>
                    <a
                      href={`/${snap.org.slug}${suffix}`}
                      aria-current={active === suffix ? 'page' : undefined}
                      className={cn(
                        'inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-2 text-sm',
                        active === suffix ? 'border-primary font-medium' : 'border-transparent text-muted-foreground',
                      )}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        )}
        {!snap && <div className="h-3" />}
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6">{children}</main>
    </>
  )
}

function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-balance">{children}</h1>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  )
}

function SpecimensView({ snap }: { snap: OrgSnapshot }) {
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const list = term
    ? snap.specimens.filter((s) =>
        [s.species.scientificName, s.species.commonName, s.cultivar, s.accessionNumber, s.species.family]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(term)),
      )
    : snap.specimens
  return (
    <>
      <Title sub={`${snap.specimens.length} specimens`}>Specimens</Title>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or accession number"
        aria-label="Search specimens"
        className="h-11 w-full rounded-md border bg-background px-3 text-base"
      />
      {list.length === 0 ? (
        <Empty>No specimens match.</Empty>
      ) : (
        <ul className="-mx-2">
          {list.map((s) => (
            <SpecimenRow key={s.id} s={s} org={snap.org.slug} />
          ))}
        </ul>
      )}
    </>
  )
}

function SpecimenView({ s, snap }: { s: OfflineSpecimen; snap: OrgSnapshot }) {
  const scene = s.sceneId ? snap.scenes.find((x) => x.id === s.sceneId) : undefined
  const collections = snap.collections.filter((c) => s.collectionIds.includes(c.id))
  const tasks = snap.tasks.filter((t) => t.specimenId === s.id && (t.status === 'OPEN' || t.pending))
  const record = snap.myRecords.find((r) => r.specimenId === s.id)
  const facts: [string, ReactNode][] = [
    ['Common name', s.species.commonName],
    ['Cultivar', s.cultivar && `‘${s.cultivar}’`],
    ['Family', s.species.family],
    ['Origin', s.species.origin],
    ['Status', s.species.status],
    ['Accession', s.accessionNumber],
    [
      'Scene',
      scene && (
        <a href={`/${snap.org.slug}/scenes/${scene.id}`} className="underline underline-offset-2">
          {scene.name}
        </a>
      ),
    ],
    ['Collections', collections.map((c) => c.name).join(', ')],
  ]
  return (
    <>
      <Photo src={specimenPhoto(s)} className="aspect-[4/3] w-full rounded-xl" />
      <Title>
        <ScientificName>{s.species.scientificName}</ScientificName>
        {s.species.authority && <span className="ml-2 text-base font-normal text-muted-foreground">{s.species.authority}</span>}
      </Title>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {facts
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>
      {s.notes && (
        <Section title="Notes">
          <p className="whitespace-pre-line text-sm">{s.notes}</p>
        </Section>
      )}
      {s.species.description && (
        <Section title="About this plant">
          <p className="whitespace-pre-line text-sm">{s.species.description}</p>
        </Section>
      )}
      {tasks.length > 0 && (
        <Section title="To do">
          <ul className="space-y-2">
            {tasks.map((t) => (
              <TaskRow key={t.id} t={t} snap={snap} />
            ))}
          </ul>
        </Section>
      )}
      <Section title={record ? recordTitle(record) : 'My record'}>
        <RecordWorkPanel org={snap.org.slug} specimenId={s.id} />
        {record && <RecordEntries record={record} />}
      </Section>
    </>
  )
}

function SceneList({ scenes, snap }: { scenes: OfflineScene[]; snap: OrgSnapshot }) {
  return (
    <ul className="divide-y rounded-lg border">
      {scenes.map((sc) => {
        const count = snap.specimens.filter((s) => s.sceneId === sc.id).length
        return (
          <li key={sc.id}>
            <a href={`/${snap.org.slug}/scenes/${sc.id}`} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 hover:bg-muted">
              <span className="min-w-0">
                <span className="block font-medium">{sc.title ?? sc.name}</span>
                {sc.title && <span className="block text-xs text-muted-foreground">{sc.name}</span>}
              </span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {count} plant{count === 1 ? '' : 's'}
              </span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

function ScenesView({ snap }: { snap: OrgSnapshot }) {
  const active = snap.scenes.filter((s) => s.active !== false)
  const inactive = snap.scenes.filter((s) => s.active === false)
  return (
    <>
      <Title sub={`${active.length} active scene${active.length === 1 ? '' : 's'}`}>Scenes</Title>
      {active.length === 0 ? <Empty>No active scenes yet.</Empty> : <SceneList scenes={active} snap={snap} />}
      {inactive.length > 0 && (
        <Section title={`Inactive (${inactive.length})`}>
          <p className="text-sm text-muted-foreground">Open one to set it up and switch it on.</p>
          <SceneList scenes={inactive} snap={snap} />
        </Section>
      )}
    </>
  )
}

function SceneView({ scene, snap }: { scene: OfflineScene; snap: OrgSnapshot }) {
  const plants = snap.specimens.filter((s) => s.sceneId === scene.id)
  const tasks = snap.tasks.filter((t) => t.sceneId === scene.id && (t.status === 'OPEN' || t.pending))
  return (
    <>
      <Title sub={[scene.title && scene.name, `${plants.length} plant${plants.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}>
        {scene.title ?? scene.name}
      </Title>
      {/* Managers set the scene up here; changes wait on the device until there's a connection */}
      {snap.user.canManage ? <OfflineSceneEditor scene={scene} snap={snap} /> : <SceneGrid scene={scene} snap={snap} />}
      {tasks.length > 0 && (
        <Section title="To do">
          <ul className="space-y-2">
            {tasks.map((t) => (
              <TaskRow key={t.id} t={t} snap={snap} />
            ))}
          </ul>
        </Section>
      )}
      <Section title="Plants">
        {plants.length === 0 ? (
          <Empty>No plants in this scene yet.</Empty>
        ) : (
          <ul className="-mx-2">
            {plants.map((s) => (
              <SpecimenRow key={s.id} s={s} org={snap.org.slug} />
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}

function CollectionsView({ snap }: { snap: OrgSnapshot }) {
  const groups = new Map<string, typeof snap.collections>()
  for (const c of snap.collections) {
    const key = c.typeName ?? 'Other'
    groups.set(key, [...(groups.get(key) ?? []), c])
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)))
  return (
    <>
      <Title sub={`${snap.collections.length} collections`}>Collections</Title>
      {snap.collections.length === 0 && <Empty>No collections yet.</Empty>}
      {ordered.map(([type, list]) => (
        <Section key={type} title={type}>
          <ul className="divide-y rounded-lg border">
            {list.map((c) => {
              const count = snap.specimens.filter((s) => s.collectionIds.includes(c.id)).length
              return (
                <li key={c.id} className="px-4 py-3">
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {count} plant{count === 1 ? '' : 's'}
                    </span>
                  </p>
                  {c.description && <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>}
                </li>
              )
            })}
          </ul>
        </Section>
      ))}
    </>
  )
}

function TodoView({ snap }: { snap: OrgSnapshot }) {
  const open = snap.tasks.filter((t) => t.status === 'OPEN')
  const done = snap.tasks.filter((t) => t.status === 'DONE')
  return (
    <>
      <Title sub={`${open.length} outstanding`}>To do</Title>
      {open.length === 0 ? (
        <Empty>Nothing outstanding.</Empty>
      ) : (
        <ul className="space-y-2">
          {open.map((t) => (
            <TaskRow key={t.id} t={t} snap={snap} />
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <Section title="Done in the last 30 days">
          <ul className="space-y-2">
            {done.map((t) => (
              <TaskRow key={t.id} t={t} snap={snap} />
            ))}
          </ul>
        </Section>
      )}
    </>
  )
}

function OverviewView({ snap }: { snap: OrgSnapshot }) {
  const open = snap.tasks.filter((t) => t.status === 'OPEN')
  const overdue = open.filter((t) => t.dueDate && Date.parse(t.dueDate) < startOfToday())
  const stats: [string, number, string][] = [
    ['Specimens', snap.specimens.length, '/specimens'],
    ['Collections', snap.collections.length, '/collections'],
    ['Scenes', snap.scenes.length, '/scenes'],
    ['Outstanding tasks', open.length, '/todo'],
  ]
  return (
    <>
      <Title>{snap.org.name}</Title>
      <ul className="grid grid-cols-2 gap-3">
        {stats.map(([label, n, suffix]) => (
          <li key={label}>
            <a href={`/${snap.org.slug}${suffix}`} className="block rounded-xl border p-4 hover:bg-muted">
              <span className="block text-2xl font-semibold tabular-nums">{n}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </a>
          </li>
        ))}
      </ul>
      {overdue.length > 0 && (
        <p className="text-sm font-medium text-destructive">
          {overdue.length} overdue task{overdue.length === 1 ? '' : 's'}
        </p>
      )}
    </>
  )
}

function HomeView({ snapshots, ops }: { snapshots: OrgSnapshot[]; ops: OutboxOp[] }) {
  // New records (not yet numbered) last
  const order = (r: OfflineWorkRecord) => (r.pending ? Infinity : r.recordNumber)
  const records = snapshots.flatMap((s) => s.myRecords).sort((a, b) => order(a) - order(b))
  return (
    <>
      <Title>My record</Title>
      <OutboxList ops={ops} snapshots={snapshots} />
      {records.length === 0 ? (
        <Empty>No records saved on this device.</Empty>
      ) : (
        <ul className="divide-y rounded-lg border">
          {records.map((r) => (
            <li key={r.id}>
              <a href={`/records/${r.id}`} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 hover:bg-muted">
                <span className="min-w-0 truncate">
                  <RecordNumber r={r} />
                  <ScientificName>{r.scientificName}</ScientificName>
                </span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {r.entries.length} entr{r.entries.length === 1 ? 'y' : 'ies'}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <Section title="Organisations">
        <ul className="divide-y rounded-lg border">
          {snapshots.map((s) => (
            <li key={s.org.id}>
              <a href={`/${s.org.slug}`} className="flex min-h-12 items-center px-4 py-2 font-medium hover:bg-muted">
                {s.org.name}
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}

function RecordView({ record, snap }: { record: OfflineWorkRecord; snap: OrgSnapshot }) {
  const s = record.specimenId ? snap.specimens.find((x) => x.id === record.specimenId) : undefined
  return (
    <>
      <Title sub={`First worked ${formatDate(record.firstWorkedDate)}`}>
        <RecordNumber r={record} />
        <ScientificName>{record.scientificName}</ScientificName>
      </Title>
      {s && (
        <a href={`/${snap.org.slug}/specimens/${s.id}`} className="text-sm underline underline-offset-2">
          View the plant at {snap.org.name}
        </a>
      )}
      <RecordEntries record={record} />
    </>
  )
}

function NotSaved({ what }: { what: string }) {
  return (
    <Empty>
      {what} isn&rsquo;t available offline. It will open when you&rsquo;re back online.
    </Empty>
  )
}

interface OfflineViewProps {
  route: OfflineRoute
  orgSlug: string | null
  snapshots: OrgSnapshot[]
  /** Changes on this device not yet sent, shown on top of the saved copy */
  ops: OutboxOp[]
}

export function OfflineView({ route, orgSlug, snapshots: saved, ops }: OfflineViewProps) {
  const snapshots = saved.map((s) => applyPending(s, ops))
  if (snapshots.length === 0) {
    return (
      <Chrome snap={null} active={null}>
        <Title>Nothing saved yet</Title>
        <Empty>
          Open hortlog while you&rsquo;re connected and signed in, and a copy of your organisation is saved on this device for
          use offline.
        </Empty>
      </Chrome>
    )
  }

  // A scene's QR code: find it in whichever organisation has it
  if (route.kind === 'shortCode') {
    for (const snap of snapshots) {
      const scene = snap.scenes.find((s) => s.shortCode === route.code)
      if (scene) {
        return (
          <Chrome snap={snap} active="/scenes">
            <SceneView scene={scene} snap={snap} />
          </Chrome>
        )
      }
    }
    return (
      <Chrome snap={null} active={null}>
        <NotSaved what="This scene" />
      </Chrome>
    )
  }

  if (route.kind === 'home' || route.kind === 'record') {
    if (route.kind === 'record') {
      for (const snap of snapshots) {
        const record = snap.myRecords.find((r) => r.id === route.recordId)
        if (record) {
          return (
            <Chrome snap={null} active="record">
              <RecordView record={record} snap={snap} />
            </Chrome>
          )
        }
      }
    }
    return (
      <Chrome snap={null} active="record">
        <HomeView snapshots={snapshots} ops={ops} />
      </Chrome>
    )
  }

  const snap = snapshots.find((s) => s.org.slug === orgSlug) ?? null
  if (!snap) {
    return (
      <Chrome snap={null} active={null}>
        <NotSaved what="This page" />
        <HomeView snapshots={snapshots} ops={ops} />
      </Chrome>
    )
  }

  switch (route.kind) {
    case 'org':
      return (
        <Chrome snap={snap} active="">
          <OverviewView snap={snap} />
        </Chrome>
      )
    case 'specimens':
      return (
        <Chrome snap={snap} active="/specimens">
          <SpecimensView snap={snap} />
        </Chrome>
      )
    case 'specimen': {
      const s = snap.specimens.find((x) => x.id === route.key || x.slug === route.key)
      return (
        <Chrome snap={snap} active="/specimens">
          {s ? <SpecimenView s={s} snap={snap} /> : <NotSaved what="This plant" />}
        </Chrome>
      )
    }
    case 'scenes':
      return (
        <Chrome snap={snap} active="/scenes">
          <ScenesView snap={snap} />
        </Chrome>
      )
    case 'scene': {
      const scene = snap.scenes.find((x) => x.id === route.sceneId)
      return (
        <Chrome snap={snap} active="/scenes">
          {scene ? <SceneView scene={scene} snap={snap} /> : <NotSaved what="This scene" />}
        </Chrome>
      )
    }
    case 'publicScene': {
      const scene = snap.scenes.find((x) => x.slug === route.sceneSlug)
      const s =
        scene && route.specimenSlug
          ? snap.specimens.find((x) => x.sceneId === scene.id && x.slug === route.specimenSlug)
          : undefined
      return (
        <Chrome snap={snap} active={s ? '/specimens' : '/scenes'}>
          {s ? <SpecimenView s={s} snap={snap} /> : scene ? <SceneView scene={scene} snap={snap} /> : <NotSaved what="This page" />}
        </Chrome>
      )
    }
    case 'collections':
      return (
        <Chrome snap={snap} active="/collections">
          <CollectionsView snap={snap} />
        </Chrome>
      )
    case 'todo':
      return (
        <Chrome snap={snap} active="/todo">
          <TodoView snap={snap} />
        </Chrome>
      )
    default:
      return (
        <Chrome snap={snap} active={null}>
          <NotSaved what="This page" />
        </Chrome>
      )
  }
}
