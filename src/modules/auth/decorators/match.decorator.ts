import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Custom validator constraint for matching fields
 * Validates that two fields have the same value
 */
@ValidatorConstraint({ name: 'Match' })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[
      relatedPropertyName
    ];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `${args.property} must match ${relatedPropertyName}`;
  }
}

/**
 * Match decorator
 * Validates that the decorated property matches another property
 * @param property - The name of the property to match against
 * @param validationOptions - Additional validation options
 * @example
 * class RegisterDto {
 *   password: string;
 *
 *   @Match('password', { message: 'Passwords do not match' })
 *   passwordConfirmation: string;
 * }
 */
export const Match = (
  property: string,
  validationOptions?: ValidationOptions,
) => {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
};
