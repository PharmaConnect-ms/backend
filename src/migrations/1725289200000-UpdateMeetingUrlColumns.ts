import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMeetingUrlColumns1725289200000 implements MigrationInterface {
    name = 'UpdateMeetingUrlColumns1725289200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update join_url column to TEXT type
        await queryRunner.query(`ALTER TABLE \`meeting\` MODIFY COLUMN \`join_url\` TEXT NOT NULL`);
        
        // Update start_url column to TEXT type  
        await queryRunner.query(`ALTER TABLE \`meeting\` MODIFY COLUMN \`start_url\` TEXT NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert join_url column back to VARCHAR(255)
        await queryRunner.query(`ALTER TABLE \`meeting\` MODIFY COLUMN \`join_url\` VARCHAR(255) NOT NULL`);
        
        // Revert start_url column back to VARCHAR(255)
        await queryRunner.query(`ALTER TABLE \`meeting\` MODIFY COLUMN \`start_url\` VARCHAR(255) NOT NULL`);
    }
}
