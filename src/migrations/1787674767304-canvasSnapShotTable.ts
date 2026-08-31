import { MigrationInterface, QueryRunner } from "typeorm";

export class CanvasSnapShotTable1787674767304 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "CANVAS_SNAP_SHOT" ("ID" SERIAL PRIMARY KEY, "PIXELCANVAS" JSONB NOT NULL, "LAST_TIME_SAVED" timestamptz NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "CANVAS_SNAP_SHOT"`);
    }

}
