// Indirection module that breaks the auth ↔ locale store require cycle.
//
// Both stores need to peek at the other's state (auth checks locale on login;
// locale syncs to backend when authed). A direct `import { useFooStore } from
// '@/state/fooStore'` from each side makes Metro warn about a require cycle
// and, because CommonJS bindings aren't live, can leave one store undefined
// at module-load time → render crash.
//
// Instead, each store calls `registerXxxAccessor(useXxxStore)` after it
// creates its hook. Consumers call `getAuthState()` / `getLocaleState()` to
// read the latest state. The lookups are lazy and resolved at call time, so
// neither store imports the other.

type AnyStore<S> = { getState: () => S; setState: (partial: Partial<S>) => void };

type AuthSnapshot = {
  isAuthed: () => boolean;
  token: string | null;
  user: { id: string } | null;
};

type LocaleSnapshot = {
  language: string;
};

let authStoreRef: AnyStore<AuthSnapshot> | null = null;
let localeStoreRef: AnyStore<LocaleSnapshot> | null = null;

export function registerAuthAccessor<S extends AuthSnapshot>(store: AnyStore<S>): void {
  authStoreRef = store as unknown as AnyStore<AuthSnapshot>;
}

export function registerLocaleAccessor<S extends LocaleSnapshot>(store: AnyStore<S>): void {
  localeStoreRef = store as unknown as AnyStore<LocaleSnapshot>;
}

export function getAuthState(): AuthSnapshot | null {
  return authStoreRef ? authStoreRef.getState() : null;
}

export function getLocaleLanguage(): string {
  return localeStoreRef ? localeStoreRef.getState().language : 'en';
}
