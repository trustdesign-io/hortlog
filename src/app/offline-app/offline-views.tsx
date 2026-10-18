'use client'

import { useState, type ReactNode } from 'react'
import { numberedOnPhoto, plantLabel } from '@/components/scene-editor/photo-scene-editor'
import { CheckCircle2, Circle } from 'lucide-react'
import { ScientificName } from '@/components/ui/scientific-name'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import { WORK_ACTION_LABELS } from '@/lib/work-action-labels'
import {
  bedPhotoUrl,
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
import { SceneThumb } from '@/app/(app)/[org]/scenes/scene-thumb'
import { cn } from '@/lib/utils'
import type { WorkAction } from '@prisma/client'


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
      {snap.user.canManage ? (
        <TaskToggle task={t} org={snap.org.slug} />
      ) : (
        <UnavailableAction
          reason={t.status === 'DONE' ? 'Your role can’t reopen tasks.' : 'Your role can’t mark tasks done.'}
          label={t.status === 'DONE' ? `Reopen ${t.title}` : `Mark ${t.title} done`}
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded text-muted-foreground"
        >
          {t.status === 'DONE' ? <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" /> : <Circle className="h-5 w-5" aria-hidden="true" />}
        </UnavailableAction>
      )}
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

function ScenePhoto({ scene, snap }: { scene: OfflineScene; snap: OrgSnapshot }) {
  const [failed, setFailed] = useState(false)
  if (!scene.photoVersion || failed) return null
  const spotted = numberedOnPhoto(snap.specimens.filter((s) => s.sceneId === scene.id))
  return (
    <div className="relative -mx-4 overflow-hidden bg-muted sm:mx-0 sm:rounded-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element -- saved on the device */}
      <img
        src={bedPhotoUrl(snap.org.slug, scene.id, scene.photoVersion)}
        alt="The bed"
        className="block h-auto w-full"
        onError={() => setFailed(true)}
      />
      {spotted.map((s, i) => (
        <a
          key={s.id}
          href={`/${snap.org.slug}/specimens/${s.id}`}
          aria-label={`${i + 1}: ${plantLabel(s)}`}
          className="absolute flex h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/90 bg-white/90 px-1.5 text-sm font-semibold text-[#16201A] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
          style={{ left: `${s.photoX * 100}%`, top: `${s.photoY * 100}%` }}
        >
          {i + 1}
        </a>
      ))}
    </div>
  )
}

/**
 * Each offline page's body. The app's own sidebar and menus are around it (see
 * offline-app.tsx), so this is just the page area.
 */
function Chrome({
  children,
}: {
  snap: OrgSnapshot | null
  active: string | null
  children: ReactNode
}) {
  return <div className="space-y-8">{children}</div>
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
            <a href={`/${snap.org.slug}/scenes/${sc.id}`} className="flex min-h-12 items-center gap-3 px-4 py-2 hover:bg-muted">
              <SceneThumb src={sc.photoVersion ? bedPhotoUrl(snap.org.slug, sc.id, sc.photoVersion) : null} />
              <span className="min-w-0 flex-1">
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
      {snap.user.canManage ? <OfflineSceneEditor scene={scene} snap={snap} /> : <ScenePhoto scene={scene} snap={snap} />}
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
  const list = [...snap.collections].sort((a, b) => a.name.localeCompare(b.name))
  return (
    <>
      <Title sub={`${snap.collections.length} collections`}>Collections</Title>
      {snap.collections.length === 0 && <Empty>No collections yet.</Empty>}
      {list.length > 0 && (
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
      )}
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
