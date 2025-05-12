const pool = require('../config/db');

const ClienteModel = {

  getAllClientes: async () => {
    const [rows] = await pool.query('SELECT * FROM clientes');
    return rows;
  },

  insertCliente: async (clienteData) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insertar cliente principal
      const clienteQuery = `
            INSERT INTO clientes (
                nombres, apellidos, cedula, cedula_pdf, direccion, telefono, sexo, fecha_nac,
                edad, ciudad, correo, barrio, estado_civil, laboral, empresa, cargo, pagaduria, 
                salario, desprendible, bienes, datacred, asesor, foto_perfil
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

      const clienteValues = [
        clienteData.nombres || null,
        clienteData.apellidos || null,
        clienteData.cedula ? parseInt(clienteData.cedula) : null,
        clienteData.cedula_pdf || null,
        clienteData.direccion || null,
        clienteData.telefono || null,
        clienteData.sexo || null,
        clienteData.fechaNacimiento || null,
        clienteData.edad ? parseInt(clienteData.edad) : null,
        clienteData.ciudad || null,
        clienteData.correo || null,
        clienteData.barrio || null,
        clienteData.estado_civil || null,
        clienteData.laboral,
        clienteData.empresa || 'NO APLICA',
        clienteData.cargo || 'NO APLICA',
        clienteData.pagaduria || 'NO APLICA',
        clienteData.salario ? parseInt(clienteData.salario) : null,
        clienteData.desprendible || null,
        clienteData.bienes_inmuebles === 'si' ? 1 : 0,
        clienteData.data_credito === 'si' ? 1 : 0,
        clienteData.asesor || null,
        clienteData.foto_perfil || null
      ];

      const [result] = await connection.query(clienteQuery, clienteValues);
      const id_cliente = result.insertId;

      // Insertar referencias personales
      for (const ref of clienteData.referencias_personales) {
        await connection.query(
          `INSERT INTO referencias_personales 
                (id_cliente, personal_nombre, personal_telefono) 
                VALUES (?, ?, ?)`,
          [id_cliente, ref.personal_nombre, ref.personal_telefono]
        );
      }

      // Insertar referencias familiares
      for (const ref of clienteData.referencias_familiares) {
        await connection.query(
          `INSERT INTO referencias_familiares 
                (id_cliente, familia_nombre, familia_telefono, parentesco) 
                VALUES (?, ?, ?, ?)`,
          [id_cliente, ref.familia_nombre, ref.familia_telefono, ref.parentesco]
        );
      }

      await connection.commit();
      return { id_cliente };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }



};

module.exports = ClienteModel;
