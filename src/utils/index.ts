import { ValidationError } from "class-validator";
import { CustomValidationError } from "../types";

export function getValidatorErrors(
  errors: ValidationError[]
): CustomValidationError[] {
  const validationErrors = errors.map((error) => {
    const constraints = Object.values(error?.constraints || {});

    return {
      property: error.property,
      constraints,
    };
  });

  return validationErrors;
}
