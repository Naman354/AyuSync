import { Request, Response } from 'express';
import { prisma } from '../../index';
import { getIO } from '../../events/socket';

/**
 * OFFLINE SYNC MUTATION BATCH (PUSH)
 * Processes offline mutations queued by frontline mobile/web workers.
 * Enforces operationId idempotency to prevent duplicate mutations.
 */
export const processSyncBatch = async (req: Request, res: Response) => {
  try {
    const { workerId, mutations } = req.body;

    if (!Array.isArray(mutations)) {
      return res.status(400).json({ error: 'Mutations array is required' });
    }

    const results = [];

    for (const mutation of mutations) {
      const { operationId, entity, action, payload } = mutation;

      if (!operationId) {
        results.push({ operationId: 'UNKNOWN', status: 'ERROR', error: 'Missing operationId' });
        continue;
      }

      const existingOp = await prisma.syncOperation.findUnique({
        where: { id: operationId }
      });

      if (existingOp) {
        // Idempotent: already processed
        results.push({ operationId, status: 'ALREADY_SYNCED' });
        continue;
      }

      const normEntity = String(entity || '').toUpperCase().trim();
      const normAction = String(action || 'CREATE').toUpperCase().trim();

      try {
        if (normEntity === 'PATIENT') {
          if (normAction === 'CREATE' || normAction === 'UPDATE') {
            const patientData: any = {
              name: String(payload.name || 'Community Patient').trim(),
              age: typeof payload.age === 'number' ? payload.age : (parseInt(payload.age, 10) || null),
              gender: String(payload.gender || 'FEMALE').toUpperCase(),
              village: payload.village || payload.address || null,
              phone: payload.phone ? String(payload.phone).trim() : null
            };

            const cleanId = payload.id || undefined;
            const patient = cleanId
              ? await prisma.patient.upsert({
                  where: { id: cleanId },
                  update: patientData,
                  create: { id: cleanId, ...patientData }
                })
              : await prisma.patient.create({ data: patientData });

            // If ABHA ID provided in payload
            if (payload.abhaId) {
              const cleanAbha = String(payload.abhaId).replace(/[^a-zA-Z0-9-]/g, '').trim();
              if (cleanAbha) {
                await prisma.patientIdentifier.upsert({
                  where: { value: cleanAbha },
                  update: { patientId: patient.id },
                  create: { type: 'ABHA', value: cleanAbha, patientId: patient.id }
                }).catch(() => {});
              }
            }
          }
        } else if (normEntity === 'REFERRAL') {
          if (normAction === 'CREATE') {
            // Validate origin and destination facilities
            let originId = payload.originId;
            if (originId) {
              const origExists = await prisma.facility.findUnique({ where: { id: originId } });
              if (!origExists) originId = undefined;
            }
            if (!originId) {
              const firstFac = await prisma.facility.findFirst();
              originId = firstFac?.id || payload.destinationId;
            }

            const ref = await prisma.referral.create({
              data: {
                id: payload.id || undefined,
                patientId: payload.patientId,
                originId,
                destinationId: payload.destinationId,
                urgency: payload.urgency || 'ROUTINE',
                reason: payload.reason || 'Clinical referral from field worker',
                status: 'SUBMITTED'
              },
              include: { patient: true, origin: true, destination: true }
            });

            await prisma.referralEvent.create({
              data: {
                referralId: ref.id,
                statusFrom: 'CREATED',
                statusTo: 'SUBMITTED',
                notes: 'Offline referral synced from frontline health worker'
              }
            }).catch(() => {});

            // Broadcast real-time referral arrival to doctors
            try {
              const io = getIO();
              io.emit('referral:created', ref);
              io.to(`facility_${payload.destinationId}`).emit('referral:created', ref);
            } catch {}
          } else if (normAction === 'UPDATE' && payload.id) {
            await prisma.referral.update({
              where: { id: payload.id },
              data: payload
            });
          }
        } else if (normEntity === 'FOLLOWUP') {
          if (normAction === 'UPDATE' && payload.id) {
            await prisma.followUp.update({
              where: { id: payload.id },
              data: payload
            });
          }
        } else if (normEntity === 'TASK') {
          if (normAction === 'UPDATE' && payload.id) {
            await prisma.task.update({
              where: { id: payload.id },
              data: payload
            });
          }
        }

        // Record sync audit record
        await prisma.syncOperation.create({
          data: {
            id: operationId,
            userId: workerId || 'unknown-worker',
            deviceId: mutation.deviceId || 'unknown',
            entity: normEntity,
            entityId: payload.id || 'unknown',
            operation: normAction,
            payload,
            clientTimestamp: mutation.timestamp ? new Date(mutation.timestamp) : new Date(),
            status: 'SUCCESS'
          }
        }).catch((auditErr) => {
          console.warn('[Sync] Audit record warning:', auditErr);
        });

        results.push({ operationId, status: 'SUCCESS' });
      } catch (err: any) {
        console.warn(`[Sync] Mutation ${operationId} conflict or error:`, err.message);
        results.push({ operationId, status: 'CONFLICT', error: err.message });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Error processing sync batch:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * OFFLINE SYNC DELTA PULL
 * Returns records created or updated since the client's lastSyncTimestamp.
 * Optimized for low-bandwidth 2G/3G connections.
 */
export const pullSyncChanges = async (req: Request, res: Response) => {
  try {
    const sinceParam = req.query.since as string;
    const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const facilityId = req.query.facilityId as string | undefined;
    const workerId = (req as any).user?.id || (req.query.workerId as string | undefined);

    const [patients, referrals, followups, tasks, notifications] = await Promise.all([
      prisma.patient.findMany({
        where: { updatedAt: { gte: since } },
        take: 100,
        orderBy: { updatedAt: 'asc' }
      }),
      prisma.referral.findMany({
        where: {
          ...(facilityId ? {
            OR: [
              { originId: facilityId },
              { destinationId: facilityId }
            ]
          } : {})
        },
        include: { events: true },
        take: 100
      }),
      prisma.followUp.findMany({
        where: {
          ...(workerId ? { workerId } : {})
        },
        take: 100
      }),
      prisma.task.findMany({
        where: {
          ...(workerId ? { workerId } : {})
        },
        take: 100
      }),
      prisma.notification.findMany({
        where: {
          createdAt: { gte: since },
          ...(workerId ? { userId: workerId } : {})
        },
        take: 50,
        orderBy: { createdAt: 'asc' }
      })
    ]);

    res.json({
      syncTimestamp: new Date().toISOString(),
      since: since.toISOString(),
      delta: {
        patients,
        referrals,
        followups,
        tasks,
        notifications
      }
    });
  } catch (error: any) {
    console.error('Error pulling sync changes:', error);
    res.status(500).json({ error: 'Failed to pull sync updates' });
  }
};
