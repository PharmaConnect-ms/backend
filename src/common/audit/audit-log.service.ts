import { mkdir, readdir, rename, stat, unlink, writeFile } from 'fs/promises';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { RequestContextService } from '@/common/logging/request-context.service';
import { redactSensitive } from '@/common/logging/redaction.util';

export type PhiAction = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE';

export interface PhiAuditEvent {
  action: PhiAction;
  resource: string;
  patientId?: string | number;
  recordId?: string | number;
  actorUserId?: string | number;
  actorRole?: string;
  status?: 'success' | 'failure';
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  private readonly logsDir = path.join(process.cwd(), 'logs');
  private readonly auditPath = path.join(this.logsDir, 'audit.log');
  private readonly maxBytes = 5 * 1024 * 1024;
  private readonly maxArchivedFiles = 14;
  private rotatedAt = 0;

  constructor(private readonly context: RequestContextService) {}

  async writePhiAuditEvent(event: PhiAuditEvent): Promise<void> {
    await this.ensureReady();
    await this.rotateIfNeeded();

    const requestContext = this.context.get();
    const payload = {
      timestamp: new Date().toISOString(),
      requestId: requestContext?.requestId,
      ip: requestContext?.ip,
      userAgent: requestContext?.userAgent,
      actorUserId: event.actorUserId ?? requestContext?.userId,
      actorRole: event.actorRole ?? requestContext?.userRole,
      action: event.action,
      resource: event.resource,
      patientId: event.patientId,
      recordId: event.recordId,
      status: event.status ?? 'success',
      details: redactSensitive(event.details ?? {}),
    };

    await writeFile(this.auditPath, `${JSON.stringify(payload)}\n`, { encoding: 'utf8', flag: 'a', mode: 0o600 });
  }

  private async ensureReady(): Promise<void> {
    await mkdir(this.logsDir, { recursive: true, mode: 0o700 });
  }

  private async rotateIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.rotatedAt < 5000) {
      return;
    }

    this.rotatedAt = now;
    try {
      const existing = await stat(this.auditPath);
      if (existing.size < this.maxBytes) {
        return;
      }

      const rotatedPath = path.join(this.logsDir, `audit-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
      await rename(this.auditPath, rotatedPath);
      await this.cleanupOldArchives();
    } catch {
      // First write when file does not exist.
    }
  }

  private async cleanupOldArchives(): Promise<void> {
    const files = await readdir(this.logsDir);
    const archives = files
      .filter((name) => /^audit-.*\.log$/.test(name))
      .sort((a, b) => b.localeCompare(a));

    const toDelete = archives.slice(this.maxArchivedFiles);
    await Promise.all(
      toDelete.map(async (fileName) => {
        try {
          await unlink(path.join(this.logsDir, fileName));
        } catch {
          // keep moving if cleanup fails on a file
        }
      }),
    );
  }
}
