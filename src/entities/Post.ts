import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity({ name: "post" })
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ type: "date" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "date" })
  updatedAt!: Date;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "number", nullable: true })
  authorId?: number;

  @ManyToOne(() => User, (user) => user.posts, { nullable: true })
  author?: User;

  @Column()
  text!: string;

  @Column({ type: "int", default: 0 })
  points!: number;
}
