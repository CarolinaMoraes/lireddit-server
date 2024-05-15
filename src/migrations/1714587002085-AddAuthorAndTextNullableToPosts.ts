import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthorAndTextNullableToPosts1714587002085 implements MigrationInterface {
    name = 'AddAuthorAndTextNullableToPosts1714587002085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" ADD "authorId" integer`);
        await queryRunner.query(`ALTER TABLE "post" ADD "text" character varying`);
        await queryRunner.query(`ALTER TABLE "post" ADD "points" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_c6fb082a3114f35d0cc27c518e0" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_c6fb082a3114f35d0cc27c518e0"`);
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "points"`);
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "text"`);
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "authorId"`);
    }

}
