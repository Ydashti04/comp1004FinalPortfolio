const knex = require('knex')(require('./knexfile'));

knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('username').unique().notNullable();
    table.string('password').notNullable();
}).then(() => {
    console.log('Users table created');
}).catch(err => {
    console.error('Error creating table:', err);
});

knex.schema.createTable('notes', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().unsigned();
    table.string('title').notNullable();
    table.string('content').notNullable();

}).then(() => {
    console.log('Notes table created');
}).catch(err => {
    console.error('Error creating table:', err);
});
