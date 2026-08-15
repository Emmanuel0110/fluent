/**
 * The name to show for a user. `displayName` is optional and cosmetic, so any
 * user without one is shown under their login `username`.
 */
export const resolveDisplayName = (user) => user?.displayName || user?.username;
