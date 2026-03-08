const STORAGE_KEY = "cricket_my_registrations";

export interface LocalRegistration {
  teamId: string; // bigint as string
  tournamentId: string;
  teamName: string;
  captainName: string;
  registeredAt: string;
}

export function getLocalRegistrations(): LocalRegistration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalRegistration[];
  } catch {
    return [];
  }
}

export function addLocalRegistration(reg: LocalRegistration) {
  const existing = getLocalRegistrations();
  // Avoid duplicates
  const filtered = existing.filter((r) => r.teamId !== reg.teamId);
  filtered.push(reg);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function removeLocalRegistration(teamId: string) {
  const existing = getLocalRegistrations();
  const filtered = existing.filter((r) => r.teamId !== teamId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
