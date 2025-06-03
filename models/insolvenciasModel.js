const pool = require('../config/db');

const insolvenciaModel = {
    getAllClienteInsol: async () => {
        try {
            const [rows] = await pool.query(`
              SELECT 
                    c.id_cliente, 
                    c.nombres, 
                    c.apellidos, 
                    c.cedula, 
                    c.correo,
                    c.fecha_vinculo,
                    c.foto_perfil,
                    c.telefono,
                    c.direccion,
                    c.ciudad,
                    i.id_insolvencia
                FROM 
                    clientes c
                JOIN 
                    insolvencia i ON c.id_cliente = i.id_cliente
            `);
            return rows;
        } catch (error) {
            console.error('Error al obtener los clientes con DataCrédito:', error);
            throw error;
        }
    },

    updateInsolvenciaData: async ({ id_cliente, cuadernillo, radicacion, correcciones, acta_aceptacion }) => {
        try {
            let sql = `
            UPDATE insolvencia
            SET cuadernillo = ?, radicacion = ?, correcciones = ?
        `;
            const params = [cuadernillo, radicacion, correcciones];

            // Solo agrega acta_aceptacion si viene definido
            if (acta_aceptacion) {
                sql += `, acta_aceptacion = ?`;
                params.push(acta_aceptacion);
            }

            sql += ` WHERE id_cliente = ?`;
            params.push(id_cliente);

            const [result] = await pool.query(sql, params);
            return result;
        } catch (error) {
            console.error('Error al actualizar insolvencia:', error);
            throw error;
        }
    },

};



module.exports = insolvenciaModel;

