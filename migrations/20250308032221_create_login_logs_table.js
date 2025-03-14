/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable("login_logs", (table) => {
        table.increments("id").primary();
        table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
        table.timestamp("timestamp").defaultTo(knex.fn.now());
      });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists("login_logs");
};
