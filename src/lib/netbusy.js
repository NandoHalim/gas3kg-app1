// src/lib/netbusy.js

export function netBusyStart() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('net:busy:start'));
  }
}

export function netBusyStop() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('net:busy:stop'));
  }
}

export async function withNetBusy(promise) {
  netBusyStart();
  try {
    return await promise;
  } finally {
    netBusyStop();
  }
}

export async function withTimeout(promise, ms = 12000, label = 'Permintaan') {
  let to;
  const timeout = new Promise((_, reject) => {
    to = setTimeout(() => reject(new Error(`${label} melebihi ${Math.round(ms/1000)}s (jaringan lambat?)`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(to);
  }
}

export function withBusyTimeout(promise, ms = 12000, label = 'Permintaan') {
  return withNetBusy(withTimeout(promise, ms, label));
}
