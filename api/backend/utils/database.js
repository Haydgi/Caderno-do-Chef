/**
 * Helper para executar queries com transaction
 */
import db from '../database/connection.js';
import logger from './logger.js';

/**
 * Executa uma função dentro de uma transação
 * @param {Function} callback - Função que recebe a connection como parâmetro
 * @returns Promise com resultado da transação
 */
export async function withTransaction(callback) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('Transaction rolled back', { error: error.message });
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Executa query com timing e logging
 */
export async function queryWithLogging(sql, params = []) {
  const start = Date.now();
  try {
    const result = await db.query(sql, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      logger.warn('Slow query detected', { 
        duration: `${duration}ms`,
        sql: sql.substring(0, 100) 
      });
    } else {
      logger.debug('Query executed', { 
        duration: `${duration}ms` 
      });
    }
    
    return result;
  } catch (error) {
    logger.error('Query failed', { 
      error: error.message, 
      sql: sql.substring(0, 100) 
    });
    throw error;
  }
}

/**
 * Helper para buscar um único registro
 */
export async function findOne(table, conditions, fields = '*') {
  const whereClause = Object.keys(conditions)
    .map(key => `${key} = ?`)
    .join(' AND ');
  
  const values = Object.values(conditions);
  const sql = `SELECT ${fields} FROM ${table} WHERE ${whereClause} LIMIT 1`;
  
  const [rows] = await queryWithLogging(sql, values);
  return rows[0] || null;
}

/**
 * Helper para buscar múltiplos registros
 */
export async function findMany(table, conditions = {}, options = {}) {
  const { 
    fields = '*', 
    orderBy = null, 
    limit = null, 
    offset = null 
  } = options;
  
  let sql = `SELECT ${fields} FROM ${table}`;
  const values = [];
  
  if (Object.keys(conditions).length > 0) {
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    sql += ` WHERE ${whereClause}`;
    values.push(...Object.values(conditions));
  }
  
  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }
  
  if (limit) {
    sql += ` LIMIT ?`;
    values.push(limit);
  }
  
  if (offset) {
    sql += ` OFFSET ?`;
    values.push(offset);
  }
  
  const [rows] = await queryWithLogging(sql, values);
  return rows;
}

/**
 * Helper para inserir registro
 */
export async function insertOne(table, data) {
  const fields = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map(() => '?').join(', ');
  const values = Object.values(data);
  
  const sql = `INSERT INTO ${table} (${fields}) VALUES (${placeholders})`;
  const [result] = await queryWithLogging(sql, values);
  
  return result.insertId;
}

/**
 * Helper para atualizar registro
 */
export async function updateOne(table, data, conditions) {
  const setClause = Object.keys(data)
    .map(key => `${key} = ?`)
    .join(', ');
  
  const whereClause = Object.keys(conditions)
    .map(key => `${key} = ?`)
    .join(' AND ');
  
  const values = [...Object.values(data), ...Object.values(conditions)];
  
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  const [result] = await queryWithLogging(sql, values);
  
  return result.affectedRows;
}

/**
 * Helper para deletar registro
 */
export async function deleteOne(table, conditions) {
  const whereClause = Object.keys(conditions)
    .map(key => `${key} = ?`)
    .join(' AND ');
  
  const values = Object.values(conditions);
  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  const [result] = await queryWithLogging(sql, values);
  
  return result.affectedRows;
}

/**
 * Helper para contar registros
 */
export async function count(table, conditions = {}) {
  let sql = `SELECT COUNT(*) as total FROM ${table}`;
  const values = [];
  
  if (Object.keys(conditions).length > 0) {
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    sql += ` WHERE ${whereClause}`;
    values.push(...Object.values(conditions));
  }
  
  const [rows] = await queryWithLogging(sql, values);
  return rows[0].total;
}

/**
 * Helper para busca com paginação
 */
export async function paginate(table, page = 1, limit = 10, conditions = {}, options = {}) {
  const offset = (page - 1) * limit;
  const total = await count(table, conditions);
  
  const rows = await findMany(table, conditions, {
    ...options,
    limit,
    offset
  });
  
  return {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export default {
  withTransaction,
  queryWithLogging,
  findOne,
  findMany,
  insertOne,
  updateOne,
  deleteOne,
  count,
  paginate
};
