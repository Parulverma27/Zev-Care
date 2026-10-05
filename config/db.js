import dotenv from 'dotenv';
dotenv.config();

import Sequelize from 'sequelize';

const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zevota_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: (process.env.DB_DIALECT || process.env.DB_DIALECT_FORCE) === 'mysql' ? 'mysql' : 'sqlite',
    storage: './database/database.sqlite',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  },
  test: {
    username: 'root',
    password: '',
    database: 'zevota_db_test',
    host: '127.0.0.1',
    port: 3306,
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Sql@123#',
    database: process.env.DB_NAME || 'zevota_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'sqlite', // Default to sqlite for Railway
    storage: process.env.DB_STORAGE || './database/database.sqlite', // Use persistent volume
    logging: false,
  },
};

const dbConfig = config[env];

export const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    storage: dbConfig.storage,
    logging: dbConfig.logging,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  }
);

export default dbConfig;
