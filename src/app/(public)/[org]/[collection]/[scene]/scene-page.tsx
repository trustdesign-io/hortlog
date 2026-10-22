import { cache } from "react";
import { ChevronRight, Flower2, Leaf } from "lucide-react";
import { locationPath } from "@/lib/locations";
import { bedPhotoUrl } from "@/lib/offline/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BedPhotoView, type ScenePlant } from "./bed-photo-view";
import { SceneSplash } from "./scene-splash";
import { GaEvent } from "@/components/ga-event";
import { OfflineNotice } from "@/components/offline/offline-notice";
import { publicScenePath } from "@/lib/scene-urls";
import { currentStage } from "@/lib/plant-stage";
import { SceneNotes } from "@/components/scene-notes";

/** Shared by /[org]/[collection]/[scene] and /[org]/scene/[scene] (no collection). */
export async function sceneMetadata(
  orgSlug: string,
  collectionSlug: string | null,
  sceneSlug: string,
) {
  const data = await resolveScene(orgSlug, collectionSlug, sceneSlug);
  if (!data) return {};

  const title = `${data.scene.title ?? data.scene.name} — ${data.org.name}`;
  const description = `What’s growing in this bed at ${data.org.name}: tap a plant to find out what it is, where it comes from and how it got here.`;
  const canonical = publicScenePath(
    orgSlug,
    data.scene.slug,
    data.collection?.slug ?? null,
  );

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description },
  };
}

export const resolveScene = cache(async function resolveScene(
  orgSlug: string,
  collectionSlug: string | null,
  sceneSlug: string,
) {
  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true, slug: true, logoUrl: true },
  });
  if (!org) return null;

  const collection = collectionSlug
    ? await prisma.collection.findUnique({
        where: {
          slug_organisationId: { slug: collectionSlug, organisationId: org.id },
        },
        select: { id: true, name: true, slug: true },
      })
    : null;
  if (collectionSlug && !collection) return null;

  // Without a collection in the address, only scenes that have none match
  const scene = await prisma.scene.findFirst({
    where: {
      slug: sceneSlug,
      organisationId: org.id,
      primaryCollectionId: collection?.id ?? null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      gridRows: true,
      gridCols: true,
      rowShift: true,
      splitCells: true,
      blockedCells: true,
      perspective: true,
      active: true,
      title: true,
      photoTakenAt: true,
      locationId: true,
    },
  });
  if (!scene) return null;

  // Where the scene is, outermost first: Conservatory › Arid › Madagascar
  const places = scene.locationId
    ? locationPath(
        await prisma.location.findMany({
          where: { organisationId: org.id },
          select: { id: true, name: true, parentId: true },
        }),
        scene.locationId,
      ).map((l) => l.name)
    : [];

  return { org, collection, scene, places };
});

export async function ScenePage({
  orgSlug,
  collectionSlug,
  sceneSlug,
}: {
  orgSlug: string;
  collectionSlug: string | null;
  sceneSlug: string;
  /** Old ?tab= links still arrive; there's one view now */
  rawTab?: string | undefined;
}) {
  const data = await resolveScene(orgSlug, collectionSlug, sceneSlug);
  if (!data) return notFound();

  const { org, collection, scene, places } = data;
  const gardenName = collection ? `${org.name} · ${collection.name}` : org.name;
  const where = places.length > 0 ? <PlaceTrail places={places} /> : undefined;

  // A label printed ahead for a scene that isn't in use yet
  if (!scene.active) {
    return (
      <SceneShell>
        <SceneHero
          garden={gardenName}
          logoUrl={org.logoUrl}
          title={scene.title ?? "A bed in the making"}
          where={where}
        />
        <ComingSoon
          orgSlug={org.slug}
          orgName={org.name}
          text="This bed is still being planted up."
        />
      </SceneShell>
    );
  }

  const specimens = await prisma.specimen.findMany({
    where: { sceneId: scene.id, organisationId: org.id },
    select: {
      id: true,
      slug: true,
      gridCell: true,
      extraCells: true,
      photoX: true,
      photoY: true,
      imageUrl: true,
      stage: true,
      stageSeenAt: true,
      species: {
        select: { commonName: true, scientificName: true, photoUrl: true },
      },
    },
    orderBy: { species: { commonName: "asc" } },
    take: 500,
  });

  const basePath = publicScenePath(
    orgSlug,
    sceneSlug,
    collection?.slug ?? null,
  );
  const title = scene.title ?? "What’s growing here";

  // A scene is its bed photo: until it has one, it's still being set up
  if (specimens.length === 0 || scene.photoTakenAt === null) {
    return (
      <SceneShell>
        <SceneHero garden={gardenName} logoUrl={org.logoUrl} title={title} where={where} />
        <ComingSoon
          orgSlug={org.slug}
          orgName={org.name}
          text="The plants in this bed are being catalogued."
        />
      </SceneShell>
    );
  }

  // Plants marked on the bed photo are numbered front to back, left to right as you look at it
  const spotted = specimens
    .filter((s) => s.photoX !== null && s.photoY !== null)
    .sort(
      (a, b) =>
        (a.photoY as number) - (b.photoY as number) ||
        (a.photoX as number) - (b.photoX as number),
    );
  const numberOf = new Map(spotted.map((s, i) => [s.id, i + 1]));
  const listed = [...spotted, ...specimens.filter((s) => !numberOf.has(s.id))];

  return (
    <SceneShell fill>
      <SceneSplash sceneId={scene.id} logoUrl={org.logoUrl} />
      <GaEvent
        name="view_page_load"
        params={{ view_id: scene.id, org: orgSlug }}
      />
      <SceneHero
        garden={gardenName}
        logoUrl={org.logoUrl}
        title={title}
        where={where}
        aside={<OfflineNotice />}
      />

      <BedPhotoView
        photoUrl={bedPhotoUrl(
          org.slug,
          scene.id,
          scene.photoTakenAt.toISOString(),
        )}
        basePath={basePath}
        plants={listed.map((s): ScenePlant => ({
          number: numberOf.get(s.id) ?? null,
          slug: s.slug,
          commonName: s.species.commonName,
          scientificName: s.species.scientificName,
          thumbnailUrl: s.imageUrl ?? s.species.photoUrl,
          x: s.photoX,
          y: s.photoY,
          stage: currentStage(s.stage, s.stageSeenAt),
        }))}
      />

      <SceneNotes sceneId={scene.id} />

      {scene.locationId && places.length > 0 && (
        <Link
          href={`/${org.slug}/flowering?in=${scene.locationId}`}
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border bg-card px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Flower2 className="h-4 w-4 text-primary" aria-hidden="true" />
          What’s in flower in {places[places.length - 1]}
        </Link>
      )}
    </SceneShell>
  );
}

/** Visitor pages are read outdoors: always the light, high-contrast theme */
function SceneShell({
  children,
  fill = false,
}: {
  children: React.ReactNode;
  /** Use the whole screen below the header, so the plant cards grow into it */
  fill?: boolean;
}) {
  return (
    <div
      data-daylight=""
      className={
        fill
          ? "mx-auto flex min-h-[calc(100dvh-3.5rem-1px)] max-w-2xl flex-col gap-4 px-4 pb-4 pt-4 sm:px-6"
          : "mx-auto max-w-2xl space-y-4 px-4 pb-10 pt-4 sm:px-6"
      }
    >
      {children}
    </div>
  );
}

function SceneHero({
  garden,
  logoUrl,
  title,
  intro,
  aside,
  where,
}: {
  garden: string;
  logoUrl: string | null;
  title: string;
  intro?: string;
  aside?: React.ReactNode;
  /** Where the scene is, under the garden's name */
  where?: React.ReactNode;
}) {
  return (
    <header className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-primary">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- the garden's own logo
            <img
              src={logoUrl}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
          ) : (
            <Leaf className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">{garden}</span>
        </p>
        {aside}
      </div>
      {where}
      <h1 className="font-heading text-2xl leading-tight text-balance sm:text-3xl">
        {title}
      </h1>
      {intro && (
        <p className="text-base leading-relaxed text-muted-foreground">
          {intro}
        </p>
      )}
    </header>
  );
}

function ComingSoon({
  orgSlug,
  orgName,
  text,
}: {
  orgSlug: string;
  orgName: string;
  text: string;
}) {
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6 text-center">
      <Leaf className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
      <p className="text-base">{text}</p>
      <p className="text-sm text-muted-foreground">
        There&rsquo;s plenty more to see around {orgName}.
      </p>
      <Link
        href={`/check-in/${orgSlug}`}
        className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        See what else is growing
      </Link>
    </div>
  );
}

/**
 * The places the scene is in, outermost first: Princess of Wales Conservatory › Arid › Madagascar.
 * The outermost (usually the longest) has its own line; the rest follow on the next.
 */
function PlaceTrail({ places }: { places: string[] }) {
  return (
    <nav aria-label="Where this is">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground">
        {places.map((name, i) => (
          <li key={`${i}-${name}`} className={i === 0 && places.length > 1 ? 'w-full' : 'flex items-center gap-1.5'}>
            {i > 1 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />}
            <span aria-current={i === places.length - 1 ? 'location' : undefined} className={i === places.length - 1 ? 'font-medium text-foreground' : undefined}>
              {name}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
