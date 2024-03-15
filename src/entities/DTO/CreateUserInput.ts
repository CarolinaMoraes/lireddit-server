import { IsEmail, MinLength } from "class-validator";

export class CreateUserInput {
  @MinLength(3)
  username!: string;

  @MinLength(8)
  password!: string;

  @IsEmail()
  email!: string;
}
