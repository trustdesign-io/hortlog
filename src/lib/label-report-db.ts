import { prisma } from '@/lib/prisma'
import { labelTaskDescription, labelTaskTitle, type LabelProblemValue } from '@/lib/label-report'

/**
 * Save a label report and put it on the organisation's to-do list. Reports of
 * a plant that already has an open label to-do are added to that one.
 */
export async function saveLabelReport(args: {
  specimenId: string
  problem: LabelProblemValue
  note: string | null
  userId: string | null
  fromVisitor: boolean
  visitorKey: string | null
}): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const specimen = await tx.specimen.findUniqueOrThrow({
        where: { id: args.specimenId },
        select: { id: true, organisationId: true, species: { select: { scientificName: true } } },
      })

      const open = await tx.task.findFirst({
        where: { specimenId: specimen.id, status: 'OPEN', labelReports: { some: {} } },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      })
      const taskId =
        open?.id ??
        (
          await tx.task.create({
            data: {
              organisationId: specimen.organisationId,
              specimenId: specimen.id,
              title: labelTaskTitle([args.problem], specimen.species.scientificName),
              createdById: args.userId,
            },
            select: { id: true },
          })
        ).id

      await tx.labelReport.create({
        data: {
          specimenId: specimen.id,
          problem: args.problem,
          note: args.note,
          userId: args.userId,
          fromVisitor: args.fromVisitor,
          visitorKey: args.visitorKey,
          taskId,
        },
      })

      const reports = await tx.labelReport.findMany({
        where: { taskId },
        select: { problem: true, note: true, fromVisitor: true, createdAt: true, user: { select: { name: true } } },
      })
      await tx.task.update({
        where: { id: taskId },
        data: {
          title: labelTaskTitle(
            reports.map((r) => r.problem),
            specimen.species.scientificName,
          ),
          description: labelTaskDescription(reports.map((r) => ({ ...r, by: r.user?.name ?? null }))),
        },
      })
    },
    { isolationLevel: 'Serializable' },
  )
}

/** The plant's open label to-do, for members: how many reports and what they say */
export async function openLabelIssue(specimenId: string) {
  return prisma.task.findFirst({
    where: { specimenId, status: 'OPEN', labelReports: { some: {} } },
    select: { id: true, title: true, _count: { select: { labelReports: true } } },
  })
}
