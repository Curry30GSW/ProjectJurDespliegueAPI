const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const UserModel = {

    authenticate: async (usuario, password) => {
        try {
            const query = `
        SELECT name, user, password, rol, activo
        FROM users 
        WHERE LOWER(TRIM(user)) = LOWER(TRIM(?))
      `;

            const [users] = await pool.query(query, [usuario]);

            if (users.length === 0) return null;

            const user = users[0];
            const isMatch = await bcrypt.compare(password, user.password);
            return isMatch ? user : null;

        } catch (error) {
            console.error("❌ Error en la autenticación:", error);
            throw error;
        }
    },

    registrarAuditoria: async ({ user, rol, ip_usuario, detalle_actividad }) => {
        try {
            const query = `
        INSERT INTO cei_auditoria 
        (user, rol, ip_usuario, hora_acceso, detalle_actividad) 
        VALUES (?, ?, ?, NOW(), ?)
      `;
            await pool.query(query, [user, rol, ip_usuario, detalle_actividad]);
        } catch (error) {
            console.error("❌ Error registrando auditoría:", error);
            throw error;
        }
    }

};

module.exports = UserModel;
