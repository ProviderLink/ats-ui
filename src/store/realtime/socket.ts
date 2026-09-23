import { getAuthToken } from '@/lib/api-client';
import { io, Socket } from 'socket.io-client';
import type {
  Application,
  Candidate,
  Client,
  Email,
  EmailTemplate,
  Interview,
  Job,
  PipelineTemplate,
  Tag,
} from '../types';

type ResourceType =
  | 'candidate'
  | 'job'
  | 'application'
  | 'interview'
  | 'client'
  | 'tag'
  | 'pipeline_template'
  | 'email_template'
  | 'email';

type EventAction = 'created' | 'updated' | 'deleted';

type SocketEventType = `${ResourceType}:${EventAction}`;

/** Domain-level events emitted by the backend for specific state transitions. */
type DomainEventType =
  | 'candidate:statusChanged'
  | 'application:phaseChanged'
  | 'job:statusChanged';

interface SocketMessage<T = unknown> {
  type: SocketEventType;
  data: T;
}

type StoreDispatcher = {
  candidate: {
    _patch: (c: Candidate) => void;
    _remove: (id: string) => void;
  } | null;
  job: { _patch: (j: Job) => void; _remove: (id: string) => void } | null;
  application: {
    _patch: (a: Application) => void;
    _remove: (id: string) => void;
  } | null;
  interview: {
    _patch: (i: Interview) => void;
    _remove: (id: string) => void;
  } | null;
  client: { _patch: (c: Client) => void; _remove: (id: string) => void } | null;
  tag: { _patch: (t: Tag) => void; _remove: (id: string) => void } | null;
  pipeline_template: {
    _patch: (t: PipelineTemplate) => void;
    _remove: (id: string) => void;
  } | null;
  email_template: {
    _patch: (t: EmailTemplate) => void;
    _remove: (id: string) => void;
  } | null;
  email: { _patch: (e: Email) => void } | null;
};

type InvalidatorFn = () => void;

const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ??
  'http://localhost:5001';

const DOMAIN_EVENTS: DomainEventType[] = [
  'candidate:statusChanged',
  'application:phaseChanged',
  'job:statusChanged',
];

/** Resources whose created/updated/deleted events should refresh the dashboard. */
const DASHBOARD_RESOURCES = new Set([
  'candidate',
  'application',
  'job',
  'client',
  'interview',
]);

const EVENTS: SocketEventType[] = [
  'candidate:created',
  'candidate:updated',
  'candidate:deleted',
  'job:created',
  'job:updated',
  'job:deleted',
  'application:created',
  'application:updated',
  'application:deleted',
  'interview:created',
  'interview:updated',
  'interview:deleted',
  'client:created',
  'client:updated',
  'client:deleted',
  'tag:created',
  'tag:updated',
  'tag:deleted',
  'pipeline_template:created',
  'pipeline_template:updated',
  'pipeline_template:deleted',
  'email_template:created',
  'email_template:updated',
  'email_template:deleted',
  'email:created',
  'email:updated',
];

class SocketManager {
  private socket: Socket | null = null;
  private destroyed = false;
  private invalidators: Set<InvalidatorFn> = new Set();
  private dispatchers: StoreDispatcher = {
    candidate: null,
    job: null,
    application: null,
    interview: null,
    client: null,
    tag: null,
    pipeline_template: null,
    email_template: null,
    email: null,
  };

  register<K extends keyof StoreDispatcher>(
    resource: K,
    dispatcher: StoreDispatcher[K]
  ): void {
    this.dispatchers[resource] = dispatcher;
  }

  /** Register a callback to be called when a domain event invalidates the dashboard. */
  registerInvalidator(fn: InvalidatorFn): () => void {
    this.invalidators.add(fn);
    return () => this.invalidators.delete(fn);
  }

  private invalidate(): void {
    for (const fn of this.invalidators) fn();
  }

  connect(): void {
    if (this.destroyed || this.socket?.connected) return;

    const token = getAuthToken();
    if (!token) return;

    this.destroyed = false;

    this.socket = io(`${WS_URL}/ats`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
      reconnectionAttempts: 10,
    });

    for (const event of EVENTS) {
      this.socket.on(event, (data: unknown) => {
        this.dispatch({ type: event, data } as SocketMessage);
        // Any change to an entity the dashboard aggregates should refresh it.
        const resource = event.split(':')[0] as ResourceType;
        if (DASHBOARD_RESOURCES.has(resource)) {
          this.invalidate();
        }
      });
    }

    for (const event of DOMAIN_EVENTS) {
      this.socket.on(event, () => this.invalidate());
    }

    this.socket.on('connect_error', err => {
      if (err.message?.includes('auth') || err.message?.includes('token')) {
        console.warn('[Socket] Auth error — not retrying');
        this.socket?.disconnect();
      }
    });
  }

  disconnect(): void {
    this.destroyed = true;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  reconnect(): void {
    this.destroyed = false;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connect();
  }

  joinJob(jobId: string): void {
    this.socket?.emit('join:job', jobId);
  }

  leaveJob(jobId: string): void {
    this.socket?.emit('leave:job', jobId);
  }

  joinUser(userId: string): void {
    this.socket?.emit('join:user', { userId });
  }

  leaveUser(userId: string): void {
    this.socket?.emit('leave:user', { userId });
  }

  joinApplication(): void {
    this.socket?.emit('join:applications');
  }

  leaveApplication(): void {
    this.socket?.emit('leave:applications');
  }

  joinRoom(room: string): void {
    this.socket?.emit('join:room', room);
  }

  leaveRoom(room: string): void {
    this.socket?.emit('leave:room', room);
  }

  private dispatch(msg: SocketMessage): void {
    const [resource, action] = msg.type.split(':') as [
      ResourceType,
      EventAction,
    ];

    if (action === 'deleted') {
      const id =
        (msg.data as { _id?: string; id?: string })._id ??
        (msg.data as { id: string }).id;
      switch (resource) {
        case 'candidate':
          this.dispatchers.candidate?._remove(id);
          break;
        case 'job':
          this.dispatchers.job?._remove(id);
          break;
        case 'application':
          this.dispatchers.application?._remove(id);
          break;
        case 'interview':
          this.dispatchers.interview?._remove(id);
          break;
        case 'client':
          this.dispatchers.client?._remove(id);
          break;
        case 'tag':
          this.dispatchers.tag?._remove(id);
          break;
        case 'pipeline_template':
          this.dispatchers.pipeline_template?._remove(id);
          break;
        case 'email_template':
          this.dispatchers.email_template?._remove(id);
          break;
      }
      return;
    }

    switch (resource) {
      case 'candidate':
        this.dispatchers.candidate?._patch(msg.data as Candidate);
        break;
      case 'job':
        this.dispatchers.job?._patch(msg.data as Job);
        break;
      case 'application':
        this.dispatchers.application?._patch(msg.data as Application);
        break;
      case 'interview':
        this.dispatchers.interview?._patch(msg.data as Interview);
        break;
      case 'client':
        this.dispatchers.client?._patch(msg.data as Client);
        break;
      case 'tag':
        this.dispatchers.tag?._patch(msg.data as Tag);
        break;
      case 'pipeline_template':
        this.dispatchers.pipeline_template?._patch(
          msg.data as PipelineTemplate
        );
        break;
      case 'email_template':
        this.dispatchers.email_template?._patch(msg.data as EmailTemplate);
        break;
      case 'email':
        this.dispatchers.email?._patch(msg.data as Email);
        // No manual unread increment here. The count is DERIVED from the email
        // store, and `_patch` above already inserts the arriving message — so
        // incrementing as well added two to the badge for every live email.
        break;
    }
  }
}

export const socketManager = new SocketManager();
