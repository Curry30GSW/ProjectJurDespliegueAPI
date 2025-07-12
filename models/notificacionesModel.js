// models/Notificacion.js
const pool = require('../config/db');

class Notificacion {
    static async create(fecha_notificacion, observaciones, asesor_noticacion, id_embargos) {
        try {
            const [result] = await pool.query(
                'INSERT INTO notificaciones_embargos (fecha_notificacion, observaciones, asesor_noticacion, id_embargos) VALUES (?, ?, ?, ?)',
                [fecha_notificacion, observaciones, asesor_noticacion, id_embargos]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Error al crear notificación: ${error.message}`);
        }
    }

    static async findByEmbargoId(id_embargos) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM notificaciones_embargos WHERE id_embargos = ? ORDER BY fecha_notificacion DESC',
                [id_embargos]
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al buscar notificaciones: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await pool.query(
                `SELECT 
                n.*,
                e.id_cliente,
                c.nombres,
                c.apellidos,
                c.cedula,
                e.radicado,
                e.fecha_expediente
            FROM notificaciones_embargos n
            JOIN embargos e ON n.id_embargos = e.id_embargos
            JOIN clientes c ON e.id_cliente = c.id_cliente
            ORDER BY n.fecha_notificacion DESC`
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener todas las notificaciones: ${error.message}`);
        }
    }

}

module.exports = Notificacion;