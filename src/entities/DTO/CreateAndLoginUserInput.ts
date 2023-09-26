import { IsNotEmpty, MinLength } from "class-validator";

export class CreateAndLoginUserInput {
  @MinLength(3)
  username!: string;

  @MinLength(8)
  password!: string;
}
