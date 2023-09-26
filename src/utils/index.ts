import { ValidationError } from "class-validator";

export function getConstraintMessagesFromValidatorErrors(
  errors: ValidationError[]
): string {
  const constraints = errors.reduce(
    (acc: string[], currentError: ValidationError) => {
      if (currentError.constraints) {
        acc.push(...Object.values(currentError.constraints));
      }
      return acc;
    },
    []
  );

  return constraints.join(",");
}
