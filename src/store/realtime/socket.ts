import { getAuthToken, refreshAccessToken } from '@/lib/api-client';
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
  User,
} from '../types';
import type { InterviewScorecard } from '../types/interview-scorecard.types';

type ResourceType =
  | 'candidate'
  | 'job'
  | 'application'
  | 'interview'
  | 'client'
  | 'tag'
  | 'pipeline_template'
  | 'email_template'
  | 'email'
  | 'user'
  | 'interview_scorecard';

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
  user: { _patch: (u: User) => void; _remove: (id: string) => void } | null;
  interview_scorecard: { _patch: (s: InterviewScorecard) => void } | null;
};

type InvalidatorFn = () => void;
type ResyncFn = () => Promise<void> | void;

/** Receives the full online list (snapshot) or a single user's change. */
export interface PresenceListener {
  onSnapshot: (onlineIds: string[]) => void;
  onUpdate: (userId: string, online: boolean) => void;
}

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
  'user:created',
  'user:updated',
  'user:deleted',
  'interview_scorecard:created',
  'interview_scorecard:updated',
];

class SocketManager {
  private socket: Socket | null = null;
  private destroyed = false;
  private recoverTimer: ReturnType<typeof setTimeout> | null = null;
  private recoverAttempt = 0;
  private resyncFn: ResyncFn | null = null;
  private resyncTimer: ReturnType<typeof setTimeout> | null = null;
  private hasConnected = false;
  private invalidators: Set<InvalidatorFn> = new Set();
  private presenceListener: PresenceListener | null = null;
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
    user: null,
    interview_scorecard: null,
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

  /**
   * Register the refresh to run after a RE-connect. Socket events emitted while
   * the socket was down are not replayed, so without this the stores stay stale
   * until a manual reload.
   */
  registerResync(fn: ResyncFn): void {
    this.resyncFn = fn;
  }

  /** Jittered so a server restart doesn't make every client refetch at once. */
  private scheduleResync(): void {
    if (this.resyncTimer) return;
    this.resyncTimer = setTimeout(
      () => {
        this.resyncTimer = null;
        void Promise.resolve(this.resyncFn?.()).catch(() => undefined);
        this.invalidate();
      },
      500 + Math.random() * 2500
    );
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
      // A function, so every (re)connect handshake carries the CURRENT access
      // token. A fixed object would resend the token from first connect, which
      // is rejected once it expires (2h) and left the socket permanently dead.
      auth: cb => cb({ token: getAuthToken() ?? token }),
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
      reconnectionAttempts: Infinity,
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

    this.socket.on('presence:update', (msg: { userId: string; online: boolean }) =>
      this.presenceListener?.onUpdate(msg.userId, msg.online)
    );
    // Runs on the first connect and after every reconnect, so the snapshot is
    // always refreshed once the socket is back.
    this.socket.on('connect', () => this.requestPresence());

    // The server closes the socket itself when the token is rejected, and
    // socket.io never auto-reconnects after a server-initiated close. Recover
    // by refreshing the token and connecting again.
    // The server accepts the handshake and then closes a bad token, so
    // "connected" alone is not success: only reset the backoff once the
    // connection has stayed up, otherwise a dead token would retry every second.
    let stableTimer: ReturnType<typeof setTimeout> | null = null;
    this.socket.on('connect', () => {
      // First connect of this session is covered by boot; every later one
      // follows a gap in which events may have been missed.
      const isReconnect = this.hasConnected;
      this.hasConnected = true;
      const current = this.socket;
      stableTimer = setTimeout(() => {
        if (this.socket !== current || !current?.connected) return;
        this.recoverAttempt = 0;
        // Only once the connection held: a rejected handshake connects and
        // closes at once and must not trigger a refetch loop.
        if (isReconnect) this.scheduleResync();
      }, 5000);
    });
    this.socket.on('disconnect', reason => {
      if (stableTimer) clearTimeout(stableTimer);
      if (reason === 'io server disconnect') this.scheduleRecover();
    });

    this.socket.on('connect_error', err => {
      if (err.message?.includes('auth') || err.message?.includes('token')) {
        console.warn('[Socket] Auth error — not retrying');
        this.socket?.disconnect();
      }
    });
  }

  /** Refresh the token and reopen the socket, with capped backoff + jitter. */
  private scheduleRecover(): void {
    if (this.destroyed || this.recoverTimer) return;
    const base = Math.min(1000 * 2 ** this.recoverAttempt, 30_000);
    const delay = base / 2 + Math.random() * (base / 2);
    this.recoverAttempt += 1;
    this.recoverTimer = setTimeout(() => {
      this.recoverTimer = null;
      void this.recover();
    }, delay);
  }

  private async recover(): Promise<void> {
    const socket = this.socket;
    if (this.destroyed || !socket || socket.connected) return;
    if (!getAuthToken()) return; // logged out: nothing to recover
    await refreshAccessToken();
    // The session may have ended or the socket been replaced while refreshing.
    if (this.destroyed || this.socket !== socket || socket.connected) return;
    if (!getAuthToken()) return;
    socket.connect();
    // A rejected handshake closes again; the disconnect handler retries.
    // Back off if it never even connects.
    setTimeout(() => {
      if (!this.destroyed && this.socket === socket && !socket.connected)
        this.scheduleRecover();
    }, 10_000);
  }

  private clearRecover(): void {
    if (this.recoverTimer) clearTimeout(this.recoverTimer);
    this.recoverTimer = null;
    this.recoverAttempt = 0;
  }

  disconnect(): void {
    this.destroyed = true;
    this.hasConnected = false;
    if (this.resyncTimer) clearTimeout(this.resyncTimer);
    this.resyncTimer = null;
    this.clearRecover();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  reconnect(): void {
    this.destroyed = false;
    this.hasConnected = false;
    this.clearRecover();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connect();
  }

  /** Start receiving presence for the Team page; returns the unsubscribe. */
  subscribePresence(listener: PresenceListener): () => void {
    this.presenceListener = listener;
    this.requestPresence();
    return () => {
      if (this.presenceListener === listener) this.presenceListener = null;
      this.socket?.emit('presence:unsubscribe');
    };
  }

  private requestPresence(): void {
    const listener = this.presenceListener;
    if (!listener || !this.socket?.connected) return;
    this.socket.emit('presence:subscribe', (ids: string[]) =>
      listener.onSnapshot(Array.isArray(ids) ? ids : [])
    );
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
        case 'user':
          this.dispatchers.user?._remove(id);
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
      case 'user':
        this.dispatchers.user?._patch(msg.data as User);
        break;
      case 'interview_scorecard':
        this.dispatchers.interview_scorecard?._patch(
          msg.data as InterviewScorecard
        );
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
