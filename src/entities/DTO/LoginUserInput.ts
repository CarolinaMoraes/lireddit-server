import { MinLength } from "class-validator";

export class LoginUserInput {
  usernameOrEmail!: string;

  @MinLength(8)
  password!: string;
}
