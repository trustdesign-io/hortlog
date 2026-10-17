"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PhotoSceneEditor } from "@/components/scene-editor/photo-scene-editor";
import {
  SpeciesPicker,
  type PickedSpecies,
} from "@/components/species/species-picker";
import { Button } from "@/components/ui/button";
import { identifySpecimen } from "@/lib/actions/specimen";
import { listOutbox } from "@/lib/offline/db";
import type { OutboxOp, SyncOpInput } from "@/lib/offline/ops";
import { applyPending } from "@/lib/offline/pending";
import { OUTBOX_EVENT, queueOp, SNAPSHOTS_EVENT } from "@/lib/offline/sync";
import type { OfflineSpecimen, OrgSnapshot } from "@/lib/offline/types";

/**
 * The scene editor on the live site. Changes go through the same outbox as
 * offline ones, so a weak signal never loses them, and show at once.
 */
export function LiveSceneEditor({
  snap,
  sceneId,
}: {
  snap: OrgSnapshot;
  sceneId: string;
}) {
  const router = useRouter();
  const [ops, setOps] = useState<OutboxOp[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const reload = () =>
      void listOutbox()
        .catch(() => [] as OutboxOp[])
        .then((o) => {
          if (!cancelled) setOps(o);
        });
    // A fresh copy means the changes have reached hortlog: show its version
    const refreshed = () => {
      router.refresh();
      reload();
    };
    reload();
    window.addEventListener(OUTBOX_EVENT, reload);
    window.addEventListener(SNAPSHOTS_EVENT, refreshed);
    return () => {
      cancelled = true;
      window.removeEventListener(OUTBOX_EVENT, reload);
      window.removeEventListener(SNAPSHOTS_EVENT, refreshed);
    };
  }, [router]);

  const view = useMemo(() => applyPending(snap, ops), [snap, ops]);
  const scene = view.scenes.find((s) => s.id === sceneId);
  if (!scene) return null;

  async function queue(list: SyncOpInput[]) {
    try {
      for (const op of list) await queueOp(op);
    } catch {
      setError("Couldn’t save that on this device. Please try again.");
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <PhotoSceneEditor
        snap={view}
        scene={scene}
        onQueue={(list) => void queue(list)}
        renderIdentify={(s, done) => (
          <IdentifyPlant
            org={snap.org.slug}
            specimen={s}
            onDone={() => {
              done();
              router.refresh();
            }}
          />
        )}
      />
    </div>
  );
}

function IdentifyPlant({
  org,
  specimen,
  onDone,
}: {
  org: string;
  specimen: OfflineSpecimen;
  onDone: () => void;
}) {
  const [picked, setPicked] = useState<PickedSpecies | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  return (
    <>
      <p className="text-sm font-medium">Name this plant</p>
      <SpeciesPicker
        id={`identify-${specimen.id}`}
        value={picked}
        onChange={setPicked}
        disabled={saving}
      />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button
        type="button"
        className="w-full"
        disabled={!picked || saving}
        onClick={() =>
          picked &&
          startSave(async () => {
            const r = await identifySpecimen(org, specimen.id, picked.id);
            if (r.success) onDone();
            else setError(r.error);
          })
        }
      >
        {saving ? "Saving…" : "Save name"}
      </Button>
    </>
  );
}
