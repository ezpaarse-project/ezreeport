import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('reports', (table) => {
    table.string('filename').primary();
    table.string('task_id').index();
    table.date('created_at').defaultTo(new Date()).notNullable();
    table.date('destroy_at').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('reports');
}
