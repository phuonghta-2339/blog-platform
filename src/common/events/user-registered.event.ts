/**
 * Event emitted when a new user successfully registers
 */
export class UserRegisteredEvent {
  constructor(
    public readonly userId: number,
    public readonly email: string,
    public readonly username: string,
  ) {}
}
