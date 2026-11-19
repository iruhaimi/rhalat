/**
 * Each listener needs its own live-update channel: reusing a name returns a channel that is
 * already subscribed, and adding listeners to it throws when the same hook mounts twice.
 */
export function uniqueChannelName(base: string): string {
  return `${base}-${Math.random().toString(36).slice(2, 10)}`;
}
