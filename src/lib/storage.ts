import { logger } from "./logger";

// const STORAGE_NAMESPACE = "clone-in-tower";
const STORAGE_KEYS = {
  protocol: "clone-protocol-preference",
} as const;

type StorageKeys = keyof typeof STORAGE_KEYS;

const STORAGE_DEFAULTS: Record<StorageKeys, string> = {
  protocol: "https",
} as const;

const STORAGE = {
  ...STORAGE_DEFAULTS,
};

let storageSync: Promise<{
  removeListener: () => void;
}> | null = null;

/**
 * Start syncing storage values from async local storage to in-memory storage.
 * @returns A promise that resolves to the storage values and a function to remove the listener.
 *
 * @example
 * ```ts
 * setupStorageSync().then(({ storage, removeListener}) => {
 *   // Storage system is ready and syncing
 * })
 * ```
 */
export async function setupStorageSync() {
  // Setup storage sync once
  if (!storageSync) {
    const callback = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      const storageBefore = { ...STORAGE };
      for (const [key, change] of Object.entries(changes)) {
        STORAGE[key as keyof typeof STORAGE] = change.newValue;
      }
      logger.debug("storage.updated:", {
        before: storageBefore,
        after: STORAGE,
      });
    };

    chrome.storage.onChanged.addListener(callback);

    storageSync = chrome.storage.local.get().then((result) => {
      for (const [key, value] of Object.entries(result)) {
        const storageKey = Object.entries(STORAGE_KEYS).find(
          ([_, namespace]) => namespace === key
        );
        if (!storageKey?.[0]) continue;

        STORAGE[storageKey[0] as StorageKeys] = value;
      }

      return {
        removeListener: () => chrome.storage.onChanged.removeListener(callback),
      };
    });
  }

  return storageSync.then(({ removeListener }) => {
    logger.debug("storage.ready", { ...STORAGE });
    return {
      // Always return the latest storage values
      storage: STORAGE,
      removeListener,
    };
  });
}

export function getStorageDefault(key: StorageKeys): string {
  return STORAGE_DEFAULTS[key];
}

export function getStorageValue(key: StorageKeys): string {
  return STORAGE[key];
}

export function setStorageValue(key: StorageKeys, value: string): void {
  STORAGE[key] = value;
  chrome.storage.local.set({ [STORAGE_KEYS[key]]: value });
}

export function onStorageChanged(
  callback: (storage: Partial<{ [K in StorageKeys]: string }>) => void
): () => void;
export function onStorageChanged<T extends StorageKeys = StorageKeys>(
  keys: T,
  callback: (storage: Partial<{ [K in T]: string }>) => void
): () => void;
export function onStorageChanged<T extends StorageKeys[] = StorageKeys[]>(
  keys: T,
  callback: (storage: Partial<{ [K in T[number]]: string }>) => void
): () => void;
export function onStorageChanged<
  T extends
    | StorageKeys
    | StorageKeys[]
    | ((storage: Partial<{ [K in StorageKeys]: string }>) => void),
>(
  keysOrCallback: T,
  callback?: T extends StorageKeys[]
    ? (storage: Partial<{ [K in T[number]]: string }>) => void
    : T extends StorageKeys
      ? (storage: Partial<{ [K in T]: string }>) => void
      : never
): () => void {
  // Implementation that handles both cases
  const [resolvedKeys, resolvedCallback] =
    typeof keysOrCallback === "function"
      ? [[] as StorageKeys[], keysOrCallback]
      : typeof keysOrCallback === "string"
        ? [[keysOrCallback], callback]
        : [keysOrCallback, callback];

  const wrappedCallback = (changes: {
    [key: string]: chrome.storage.StorageChange;
  }) => {
    const storage = Object.fromEntries(
      resolvedKeys.flatMap((key) =>
        changes[STORAGE_KEYS[key]].newValue
          ? [[key, changes[STORAGE_KEYS[key]].newValue]]
          : []
      )
    );

    if (Object.keys(storage).length) {
      for (const key of Object.keys(storage)) {
        STORAGE[key as StorageKeys] = storage[key as StorageKeys];
      }

      resolvedCallback?.(storage);
    }
  };

  chrome.storage.onChanged.addListener(wrappedCallback);
  return () => {
    chrome.storage.onChanged.removeListener(wrappedCallback);
  };
}
