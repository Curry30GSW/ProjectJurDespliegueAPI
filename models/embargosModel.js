const pool = require('../config/db');

const embargosModel = {
  getAllClienteEmbargos: async () => {
    try {
      const [rows] = await pool.query(`
       SELECT 
            c.id_cliente, 
            c.nombres, 
            c.apellidos, 
            c.cedula, 
            c.foto_perfil,
            e.radicado,
            estado_embargo,
            e.fecha_expediente
        FROM 
            clientes c
        JOIN 
            embargos e ON c.id_cliente = e.id_cliente
        ORDER BY 
            CASE WHEN e.estado_embargo = 1 THEN 0 ELSE 1 END`);
      return rows;
    } catch (error) {
      console.error('Error al obtener los clientes con DataCrédito:', error);
      throw error;
    }
  },

  getClientelByCedula: async (cedula) => {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT 
          c.id_cliente, 
          c.nombres, 
          c.apellidos, 
          c.cedula, 
          c.correo,
          c.fecha_vinculo,
          c.foto_perfil,
          c.telefono,
          c.ciudad,
          e.id_embargos,
          GROUP_CONCAT(p.nombre_pagaduria SEPARATOR ', ') AS pagadurias
        FROM 
          clientes c
        JOIN 
          embargos e ON c.id_cliente = e.id_cliente
        LEFT JOIN 
          pagadurias_cliente p ON c.id_cliente = p.id_cliente
        WHERE 
          c.cedula = ?
        GROUP BY 
          c.id_cliente, c.nombres, c.apellidos, c.cedula, c.correo,
          c.fecha_vinculo, c.foto_perfil, c.telefono, c.ciudad, e.id_embargos
        LIMIT 1
      `, [cedula]);

      return rows[0]; // Asumimos que LIMIT 1 traerá solo un registro
    } catch (error) {
      console.error('Error al obtener el cliente por cédula:', error);
      throw error;
    } finally {
      connection.release(); // Muy importante liberar la conexión
    }
  },

  getEmbargoById: async (id_embargos) => {
    try {
      const [rows] = await pool.query(`
                SELECT 
                    e.*,
                    c.nombres,
                    c.apellidos,
                    c.cedula
                FROM 
                    embargos e
                JOIN 
                    clientes c ON e.id_cliente = c.id_cliente
                WHERE 
                    e.id_embargos = ?
                LIMIT 1
            `, [id_embargos]);

      return rows[0];
    } catch (error) {
      console.error('Error al obtener los datos del embargo:', error);
      throw error;
    }
  },

  // Obtener todos los embargos de un cliente (por si necesitas listarlos)
  getEmbargosByCliente: async (id_cliente) => {
    try {
      const [rows] = await pool.query(`
                SELECT 
                    e.*,
                    c.nombres,
                    c.apellidos,
                    c.cedula
                FROM 
                    embargos e
                JOIN 
                    clientes c ON e.id_cliente = c.id_cliente
                WHERE 
                    e.id_cliente = ?
                ORDER BY 
                    e.fecha_radicacion DESC
            `, [id_cliente]);

      return rows;
    } catch (error) {
      console.error('Error al obtener los embargos del cliente:', error);
      throw error;
    }
  },

  // Actualizar un embargo específico por id_embargos (único)
  updateEmbargo: async (id_embargos, embargoData) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Verificar que el embargo existe
      const [check] = await connection.query(
        'SELECT id_embargos FROM embargos WHERE id_embargos = ?',
        [id_embargos]
      );

      if (check.length === 0) {
        throw new Error('El embargo no existe');
      }

      // Actualizar el embargo
      const [result] = await connection.query(`
                UPDATE embargos 
                SET 
                    valor_embargo = ?,
                    pagaduria_embargo = ?,
                    porcentaje_embargo = ?,
                    juzgado_embargo = ?,
                    fecha_radicacion = ?,
                    fecha_expediente = ?,
                    red_judicial = ?,
                    subsanaciones = ?,
                    estado_embargo = ?,
                    radicado = ?,
                    asesor_embargo = ?,
                    updated_at = NOW()
                WHERE 
                    id_embargos = ?
            `, [
        embargoData.valor_embargo,
        embargoData.pagaduria_embargo,
        embargoData.porcentaje_embargo,
        embargoData.juzgado_embargo,
        embargoData.fecha_radicacion,
        embargoData.fecha_expediente,
        embargoData.red_judicial,
        embargoData.subsanaciones,
        embargoData.estado_embargo,
        embargoData.radicado,
        embargoData.asesor_embargo,
        id_embargos
      ]);

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar el embargo:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  getAllClienteEmbargosAceptados: async () => {
    try {
      const [rows] = await pool.query(`
       SELECT 
            c.id_cliente, 
            c.nombres, 
            c.apellidos, 
            c.cedula, 
            c.foto_perfil,
            e.radicado,
            e.estado_embargo,
            e.fecha_expediente 
        FROM 
            clientes c
        JOIN 
            embargos e ON c.id_cliente = e.id_cliente
        WHERE
            e.estado_embargo = 0`);
      return rows;
    } catch (error) {
      console.error('Error al obtener los clientes con DataCrédito:', error);
      throw error;
    }
  },
};

module.exports = embargosModel;