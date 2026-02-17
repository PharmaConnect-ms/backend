import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextStore {
  requestId: string;
  ip?: string;
  userAgent?: string | string[];
  method?: string;
  path?: string;
  userId?: number | string;
  userRole?: string;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextStore>();

  runWithContext(partial: Partial<RequestContextStore>, callback: () => void): void {
    const requestId = partial.requestId ?? randomUUID();
    this.storage.run({ requestId, ...partial }, callback);
  }

  get(): RequestContextStore | undefined {
    return this.storage.getStore();
  }

  set(values: Partial<RequestContextStore>): void {
    const store = this.storage.getStore();
    if (!store) {
      return;
    }

    Object.assign(store, values);
  }

  getRequestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }
}
