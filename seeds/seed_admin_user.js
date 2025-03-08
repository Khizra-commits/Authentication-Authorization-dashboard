const bcrypt = require("bcryptjs");

exports.seed = async function (knex) {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Check if the admin user already exists
  const existingAdmin = await knex("users").where({ email: "admin@example.com" }).first();
  if (existingAdmin) {
    console.log("Admin user already exists!");
    return;
  }

  await knex("users").insert([
    {
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
    },
  ]);

  console.log("Admin user seeded successfully!");
};
