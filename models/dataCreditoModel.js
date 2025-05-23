const pool = require('../config/db');

const dataCreditoModel = {
    getAllClienteData: async () => {
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
                    d.nombreData
                FROM 
                    clientes c
                JOIN 
                    datacredito d ON c.id_cliente = d.id_cliente
            `);
            return rows;
        } catch (error) {
            console.error('Error al obtener los clientes con DataCrédito:', error);
            throw error;
        }
    },
    saveDocumentData: async (cedula, rutaDocumento, fechaAdjunto) => {
        try {
            // Obtener el ID del cliente usando la cédula
            const [cliente] = await pool.query('SELECT id_cliente FROM clientes WHERE cedula = ?', [cedula]);

            if (cliente.length === 0) {
                throw new Error('No se encontró un cliente con esa cédula.');
            }

            const idCliente = cliente[0].id_cliente;

            // Actualizar tabla datacredito
            const sql = `
            UPDATE datacredito 
            SET nombreData = ?, fecha_data = ?
            WHERE id_cliente = ?
        `;
            await pool.query(sql, [rutaDocumento, fechaAdjunto, idCliente]);

        } catch (error) {
            console.error('Error al guardar documento DataCrédito:', error);
            throw error;
        }
    }

};

module.exports = dataCreditoModel;
