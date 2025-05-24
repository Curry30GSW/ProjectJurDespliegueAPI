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
    saveDocumentData: async (cedula, rutaDocumento, fechaAdjunto, usuario) => {
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
            SET nombreData = ?, fecha_data = ?, usuario_data = ?
            WHERE id_cliente = ?
        `;
            await pool.query(sql, [rutaDocumento, fechaAdjunto, usuario, idCliente]);

        } catch (error) {
            console.error('Error al guardar documento DataCrédito:', error);
            throw error;
        }
    },

    moveAreaClient: async (cedula, nuevaArea, usuario) => {
        const cliente = await db.query('SELECT id_cliente FROM clientes WHERE cedula = ?', [cedula]);

        if (cliente.length === 0) {
            throw new Error('No se encontró un cliente con esa cédula.');
        }

        const idCliente = cliente[0].id_cliente;
        const ahora = new Date();
        const fecha = new Date(ahora.getTime() - 5 * 60 * 60 * 1000)
            .toISOString().slice(0, 19).replace('T', ' ');

        // Insertar en la tabla datacredito
        await db.query(`
        INSERT INTO datacredito (nombreData, id_cliente, fecha_data, usuario_data, area_actual)
        VALUES (?, ?, ?, ?, ?)
    `, ['Cambio de área', idCliente, fecha, usuario, nuevaArea]);

        // Actualizar el campo "area" en la tabla clientes
        await db.query(`
        UPDATE clientes SET area = ? WHERE id_cliente = ?
    `, [nuevaArea, idCliente]);

        // Insertar en la tabla correspondiente según el área
        if (nuevaArea === 'Creditos' || nuevaArea === 'Créditos' || nuevaArea === 'créditos') {
            await db.query('INSERT INTO creditos (id_cliente) VALUES (?)', [idCliente]);
        } else if (nuevaArea === 'Embargos') {
            await db.query('INSERT INTO embargos (id_cliente) VALUES (?)', [idCliente]);
        } else if (nuevaArea === 'Insolvencia') {
            await db.query('INSERT INTO insolvencia (id_cliente) VALUES (?)', [idCliente]);
        }
    }

};



module.exports = dataCreditoModel;
