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
                    c.valor_cuota,
                    c.porcentaje,
                    c.valor_insolvencia,
                    c.numero_cuotas,
                    i.id_insolvencia,
                    i.terminacion,
                    i.tipo_proceso,
                    i.desprendible
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

    updateInsolvenciaData: async ({
        id_cliente,
        cuadernillo,
        fecha_cuadernillo,
        radicacion,
        fecha_radicacion,
        correcciones,
        acta_aceptacion,
        tipo_proceso,
        juzgado,
        nombre_liquidador,
        telefono_liquidador,
        correo_liquidador,
        pago_liquidador,
        terminacion,
        motivo_insolvencia,
        asesor_insolvencia
    }) => {
        const [result] = await pool.query(`
        UPDATE insolvencia 
        SET cuadernillo = ?, 
            fecha_cuadernillo = ?,
            radicacion = ?, 
            fecha_radicacion = ?,
            correcciones = ?, 
            acta_aceptacion = ?, 
            tipo_proceso = ?, 
            juzgado = ?, 
            nombre_liquidador = ?, 
            telefono_liquidador = ?, 
            correo_liquidador = ?, 
            pago_liquidador = ?, 
            terminacion = ?, 
            motivo_insolvencia = ?,
            asesor_insolvencia = ?
        WHERE id_cliente = ?
    `, [
            cuadernillo,
            fecha_cuadernillo,
            radicacion,
            fecha_radicacion,
            correcciones,
            acta_aceptacion,
            tipo_proceso,
            juzgado,
            nombre_liquidador,
            telefono_liquidador,
            correo_liquidador,
            pago_liquidador,
            terminacion,
            motivo_insolvencia,
            asesor_insolvencia,
            id_cliente
        ]);

        if (result.affectedRows > 0) {
            const [rows] = await pool.query(`
            SELECT id_insolvencia FROM insolvencia WHERE id_cliente = ?
        `, [id_cliente]);

            return { affectedRows: result.affectedRows, id_insolvencia: rows[0]?.id_insolvencia || null };
        }

        return { affectedRows: 0, id_insolvencia: null };
    },

    insertarAudiencias: async (id_insolvencia, audiencias) => {
        const connection = await pool.getConnection();
        try {
            const values = audiencias.map(a => [a.audiencia, a.fecha_audiencias, id_insolvencia]);
            const insertSql = `
            INSERT INTO audiencias (audiencia, fecha_audiencias, id_insolvencia)
            VALUES ?
        `;
            await connection.query(insertSql, [values]);
        } catch (error) {
            console.error('Error al insertar audiencias:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    insertarDesprendibles: async (id_insolvencia, desprendibles) => {
        const connection = await pool.getConnection();
        try {
            const values = desprendibles.map(d => [
                d.estado_desprendible,
                d.desprendible,
                d.obs_desprendible,
                d.cuota_pagar,
                id_insolvencia
            ]);

            const insertSql = `
        INSERT INTO desprendible 
        (estado_desprendible, desprendible, obs_desprendible, cuota_pagar, id_insolvencia)
        VALUES ?
        `;

            await connection.query(insertSql, [values]);
        } catch (error) {
            console.error('Error al insertar desprendibles:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    getClienteInsolByCedula: async (cedula) => {
        const connection = await pool.getConnection();

        try {
            // Cliente + Insolvencia + Desprendible (sin audiencias)
            const [clienteRows] = await connection.query(`
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
                c.valor_cuota,
                c.porcentaje,
                c.valor_insolvencia,
                c.numero_cuotas,
                i.id_insolvencia,
                i.terminacion,
                i.tipo_proceso,
                i.desprendible,
                i.cuadernillo,
                i.fecha_cuadernillo,
                i.radicacion,
                i.fecha_radicacion,
                i.correcciones,
                i.acta_aceptacion,
                i.juzgado,
                i.nombre_liquidador,
                i.telefono_liquidador,
                i.correo_liquidador,
                i.pago_liquidador,
                i.motivo_insolvencia,
                i.asesor_insolvencia,
                d.estado_desprendible,
                d.desprendible AS ruta_desprendible,
                d.obs_desprendible,
                d.cuota_pagar AS cuota_pagar
            FROM 
                clientes c
            JOIN 
                insolvencia i ON c.id_cliente = i.id_cliente
            LEFT JOIN 
                desprendible d ON i.id_insolvencia = d.id_insolvencia
            WHERE 
                c.cedula = ?
            LIMIT 1
        `, [cedula]);

            if (clienteRows.length === 0) {
                return null;
            }

            const cliente = clienteRows[0];

            // Audiencias (todas)
            const [audienciasRows] = await connection.query(`
            SELECT 
                audiencia,
                fecha_audiencias
            FROM 
                audiencias
            WHERE 
                id_insolvencia = ?
        `, [cliente.id_insolvencia]);

            cliente.audiencias = audienciasRows;

            return cliente;

        } catch (error) {
            console.error('Error en getClienteInsolByCedula:', error);
            throw error;
        } finally {
            connection.release();
        }
    },


};



module.exports = insolvenciaModel;

