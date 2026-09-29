/** Signed durations (including more than 24 hours), never times of day. */
export function pontoMinutes(value: string): number {
  const match = /^(-?)(\d+):([0-5]\d)(?::[0-5]\d)?$/.exec(value.trim());
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "-" ? -minutes : minutes;
}
