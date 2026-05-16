import {Sequelize} from 'sequelize';
import dotenv from 'dotenv';
import db_config from './dbConfig.js';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const config = db_config[env];