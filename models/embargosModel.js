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
                    e.radicado
                FROM 
                    clientes c
                JOIN 
                    embargos e ON c.id_cliente = e.id_cliente
            `);
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
    }
};

module.exports = embargosModel;