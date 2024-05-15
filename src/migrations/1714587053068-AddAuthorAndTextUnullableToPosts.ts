import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthorAndTextUnullableToPosts1714587053068 implements MigrationInterface {
    name = 'AddAuthorAndTextUnullableToPosts1714587053068'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" ALTER COLUMN "text" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" ALTER COLUMN "text" DROP NOT NULL`);
    }

}
