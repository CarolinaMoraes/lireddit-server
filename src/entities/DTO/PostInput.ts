import { MinLength } from "class-validator";

export class PostInput {
  @MinLength(3)
  title!: string;

  @MinLength(1)
  text!: string;
}
