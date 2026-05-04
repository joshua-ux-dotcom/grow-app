export const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0')
);

export const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0')
);

export const EXAMPLE_CATEGORIES = ['Lernen', 'Arbeit', 'Sport'];

export const DEFAULT_SESSION_MINUTES = 30;

export function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}