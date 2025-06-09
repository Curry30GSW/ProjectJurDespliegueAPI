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
                d.couta_pagar,
                id_insolvencia
            ]);

            const insertSql = `
            INSERT INTO desprendibles 
            (estado_desprendible, desprendible, obs_desprendible, couta_pagar, id_insolvencia)
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
                    i.id_insolvencia,
                    i.terminacion,
                    i.tipo_proceso,
                    i.desprendible,
                    i.cuadernillo,
                    i.radicacion,
                    i.correcciones,
                    i.acta_aceptacion,
                    i.juzgado,
                    i.nombre_liquidador,
                    i.telefono_liquidador,
                    i.correo_liquidador,
                    i.pago_liquidador,
                    i.motivo_insolvencia,
                    i.asesor_insolvencia
                FROM 
                    clientes c
                JOIN 
                    insolvencia i ON c.id_cliente = i.id_cliente
                WHERE 
                    c.cedula = ?
            `, [cedula]);

            return rows[0]; // Devuelve el primer registro encontrado (si hay alguno)
        } catch (error) {
            console.error('Error al obtener cliente e insolvencia por cédula:', error);
            throw error;
        }
    },

};



module.exports = insolvenciaModel;

