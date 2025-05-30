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

};



module.exports = insolvenciaModel;

