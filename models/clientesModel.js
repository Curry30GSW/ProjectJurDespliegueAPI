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

      // Verificar si la cédula ya existe
      const cedulaExistQuery = `
            SELECT COUNT(*) AS count FROM clientes WHERE cedula = ?
        `;
      const [existingCedula] = await connection.query(cedulaExistQuery, [clienteData.cedula]);

      if (existingCedula[0].count > 0) {
        // La cédula ya existe, lanzar alert en el frontend
        throw new Error('Ya existe un cliente con esa cédula');
      }

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
  },

  buscarPorCedula: async (cedula) => {
    const connection = await pool.getConnection();
    try {
      // Obtener datos del cliente
      const [clienteRows] = await connection.query(
        'SELECT * FROM clientes WHERE cedula = ?',
        [cedula]
      );

      if (clienteRows.length === 0) {
        return null;
      }

      const cliente = clienteRows[0];

      // Obtener referencias familiares
      const [familiaresRows] = await connection.query(
        'SELECT * FROM referencias_familiares WHERE id_cliente = ?',
        [cliente.id_cliente]
      );

      // Obtener referencias personales
      const [personalesRows] = await connection.query(
        'SELECT * FROM referencias_personales WHERE id_cliente = ?',
        [cliente.id_cliente]
      );

      // Agregar al objeto del cliente
      cliente.referencias_familiares = familiaresRows;
      cliente.referencias_personales = personalesRows;

      return cliente;

    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  },

  updateCliente: async (cedula, clienteData) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Buscar ID del cliente a partir de la cédula
      const [rows] = await connection.query(
        'SELECT id_cliente FROM clientes WHERE cedula = ?',
        [cedula]
      );

      if (rows.length === 0) {
        throw new Error('Cliente no encontrado');
      }

      const id_cliente = rows[0].id_cliente;

      // Actualizar cliente principal
      const updateQuery = `
      UPDATE clientes SET 
        nombres = ?, 
        apellidos = ?, 
        telefono = ?, 
        correo = ?, 
        direccion = ?,  
        ciudad = ?, 
        barrio = ?, 
        estado = ?, 
        laboral = ?, 
        empresa = ?, 
        cargo = ?, 
        pagaduria = ?, 
        salario = ?, 
        desprendible = ?, 
        bienes = ?, 
        datacred = ?, 
        foto_perfil = ?
      WHERE cedula = ?
    `;

      const updateValues = [
        clienteData.nombres || null,
        clienteData.apellidos || null,
        clienteData.direccion || null,
        clienteData.telefono || null,
        clienteData.sexo || null,
        clienteData.fechaNacimiento || null,
        clienteData.edad ? parseInt(clienteData.edad) : null,
        clienteData.ciudad || null,
        clienteData.correo || null,
        clienteData.barrio || null,
        clienteData.estado_civil || null,
        clienteData.laboral || 'NO APLICA',
        clienteData.empresa || 'NO APLICA',
        clienteData.cargo || 'NO APLICA',
        clienteData.pagaduria || 'NO APLICA',
        clienteData.salario ? parseInt(clienteData.salario) : null,
        clienteData.desprendible || null,
        clienteData.bienes_inmuebles === 'si' ? 1 : 0,
        clienteData.data_credito === 'si' ? 1 : 0,
        clienteData.foto_perfil || null,
        parseInt(cedula)
      ];

      await connection.query(updateQuery, updateValues);

      // Eliminar y volver a insertar referencias personales
      await connection.query('DELETE FROM referencias_personales WHERE id_cliente = ?', [id_cliente]);
      for (const ref of clienteData.referencias_personales) {
        await connection.query(
          `INSERT INTO referencias_personales (id_cliente, personal_nombre, personal_telefono) VALUES (?, ?, ?)`,
          [id_cliente, ref.personal_nombre, ref.personal_telefono]
        );
      }

      // Eliminar y volver a insertar referencias familiares
      await connection.query('DELETE FROM referencias_familiares WHERE id_cliente = ?', [id_cliente]);
      for (const ref of clienteData.referencias_familiares) {
        await connection.query(
          `INSERT INTO referencias_familiares (id_cliente, familia_nombre, familia_telefono, parentesco) VALUES (?, ?, ?, ?)`,
          [id_cliente, ref.familia_nombre, ref.familia_telefono, ref.parentesco]
        );
      }

      await connection.commit();
      return { message: 'Cliente actualizado exitosamente' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },


};

module.exports = ClienteModel;
