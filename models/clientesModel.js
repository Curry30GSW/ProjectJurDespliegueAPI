const pool = require('../config/db');

const ClienteModel = {

  getAllClientes: async () => {
    const [rows] = await pool.query('SELECT * FROM clientes');
    return rows;
  },

  insertCliente: async (clienteData) => {
    const {
      nombres, apellidos, cedula, cedula_pdf, direccion, telefono, sexo, fecha_nac, 
      edad, ciudad, correo, barrio, estado_civil, laboral, empresa, cargo, pagaduria, 
      salario, desprendible, bienes, datacred, asesor,
      referencias_personales = [],
      referencias_familiares = []
    } = clienteData;
  
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const clienteQuery = `
        INSERT INTO clientes (
          nombres, apellidos, cedula, cedula_pdf, direccion, telefono, sexo, fecha_nac,
          edad, ciudad, correo, barrio, estado_civil, laboral, empresa, cargo, pagaduria, 
          salario, desprendible, bienes, datacred, asesor
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      const clienteValues = [
        nombres, apellidos, parseInt(cedula), cedula_pdf, direccion, telefono, sexo, fecha_nac,
        edad, ciudad, correo, barrio, estado_civil, laboral, empresa, cargo, pagaduria,
        parseInt(salario), desprendible, bienes, datacred, asesor
      ];
  
      const [result] = await connection.query(clienteQuery, clienteValues);
      const id_cliente = result.insertId;
  
      // Insertar referencias personales
      for (const ref of referencias_personales) {
        await connection.query(
          `INSERT INTO referencias_personales (id_cliente, personal_nombre, personal_telefono) VALUES (?, ?, ?)`,
          [id_cliente, ref.personal_nombre, ref.personal_telefono]
        );
      }
  
      // Insertar referencias familiares
      for (const ref of referencias_familiares) {
        await connection.query(
          `INSERT INTO referencias_familiares (id_cliente, familia_nombre, familia_telefono) VALUES (?, ?, ?)`,
          [id_cliente, ref.familia_nombre, ref.familia_telefono]
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
