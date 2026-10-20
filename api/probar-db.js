const db = require("./db");

async function probarConexion() {
  try {
    const [filas] = await db.query("SELECT DATABASE() AS base_datos");

    console.log("¡Conexión a MySQL exitosa!");
    console.log("Base de datos:", filas[0].base_datos);
  } catch (error) {
    console.error("Error al conectar con MySQL:", error.message);
  } finally {
    await db.end();
  }
}

probarConexion();