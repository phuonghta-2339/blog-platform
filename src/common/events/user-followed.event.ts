/**
 * Event emitted when a user follows another user
 */
export class UserFollowedEvent {
  constructor(
    public readonly followerId: number,
    public readonly followingId: number,
    public readonly followerUsername: string,
    public readonly followingUsername: string,
    public readonly followingEmail: string,
  ) {}
}
