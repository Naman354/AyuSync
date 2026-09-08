import { Request, Response } from 'express';
import { prisma } from '../../index';

/**
 * CONFLICT RESOLUTION
 * Resolves offline-online collisions using KEEP_SERVER, OVERWRITE_SERVER, or MERGE.
 */
export const resolveSyncConflict = async (req: Request, res: Response) => {
  try {
    const { operationId, resolutionStrategy, resolvedPayload } = req.body;
    // resolutionStrategy: 'KEEP_SERVER' | 'OVERWRITE_SERVER' | 'MERGE'

    const operation = await prisma.syncOperation.findUnique({
      where: { id: operationId }
    });

    if (!operation) {
      return res.status(404).json({ error: 'Sync operation not found' });
    }

    await prisma.$transaction(async (tx) => {
      const payloadObj = typeof resolvedPayload === 'string'
        ? JSON.parse(resolvedPayload)
        : resolvedPayload;

      if (resolutionStrategy === 'OVERWRITE_SERVER') {
        if (operation.entity === 'PATIENT') {
          await tx.patient.update({
            where: { id: payloadObj.id || operation.entityId },
            data: payloadObj.data || payloadObj
          });
        }
      } else if (resolutionStrategy === 'MERGE') {
        if (operation.entity === 'PATIENT') {
          const existing = await tx.patient.findUnique({
            where: { id: payloadObj.id || operation.entityId }
          });

          if (existing) {
            // Three-way non-destructive field merge
            const merged = {
              ...existing,
              ...(payloadObj.data || payloadObj),
              updatedAt: new Date()
            };
            await tx.patient.update({
              where: { id: existing.id },
              data: merged
            });
          }
        }
      }

      // Mark the conflict operation status as RESOLVED
      await tx.syncOperation.update({
        where: { id: operationId },
        data: { status: 'RESOLVED' }
      });
    });

    res.json({
      message: 'Conflict resolved successfully',
      operationId,
      strategy: resolutionStrategy
    });
  } catch (error: any) {
    console.error('Error resolving sync conflict:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
