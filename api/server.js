const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.json({
    mensaje: "API de KFE funcionando correctamente",
  });
});

// Consultar productos activos
app.get("/api/productos", async (req, res) => {
  try {
      const [productos] = await db.query(`
    SELECT
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.id_categoria,
      p.activo,
      c.nombre AS categoria
    FROM productos p
    LEFT JOIN categorias c
      ON p.id_categoria = c.id_categoria
    WHERE p.activo = 1
    ORDER BY p.nombre ASC
  `)
    res.json(productos);
  } catch (error) {
    console.error("Error al consultar productos:", error.message);

    res.status(500).json({
      error: "No se pudieron consultar los productos",
    });
  }
});


 // Consultar categorías
app.get("/api/categorias", async (req, res) => {
  try {
    const [categorias] = await db.query(`
      SELECT id_categoria, nombre
      FROM categorias
      ORDER BY nombre ASC
    `);

    res.json(categorias);
  } catch (error) {
    console.error("Error al consultar categorías:", error.message);

    res.status(500).json({
      error: "No se pudieron consultar las categorías",
    });
  }
});

/* Registrar un producto */
app.post("/api/productos", async (req, res) => {
  const {
    nombre,
    descripcion = "",
    precio,
    stock = 0,
    id_categoria,
  } = req.body;

  if (
    typeof nombre !== "string" ||
    !nombre.trim() ||
    !Number.isFinite(Number(precio)) ||
    Number(precio) < 0 ||
    !Number.isInteger(Number(stock)) ||
    Number(stock) < 0 ||
    !Number.isInteger(Number(id_categoria)) ||
    Number(id_categoria) <= 0
  ) {
    return res.status(400).json({
      error: "Verifica el nombre, precio, stock y categoría del producto.",
    });
  }

  try {
    const [resultado] = await db.query(
      `INSERT INTO productos
        (nombre, descripcion, precio, stock, id_categoria, activo)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        nombre.trim(),
        descripcion,
        Number(precio),
        Number(stock),
        Number(id_categoria),
      ]
    );

    res.status(201).json({
      mensaje: "Producto registrado correctamente.",
      id_producto: resultado.insertId,
    });
  } catch (error) {
    console.error("Error al registrar producto:", error.message);
    res.status(500).json({
      error: "No se pudo registrar el producto. Verifica la categoría.",
    });
  }
});


/* Editar un producto */
app.put("/api/productos/:id", async (req, res) => {
  const id = Number(req.params.id);
  const {
    nombre,
    descripcion = "",
    precio,
    stock,
    id_categoria,
  } = req.body;

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    typeof nombre !== "string" ||
    !nombre.trim() ||
    !Number.isFinite(Number(precio)) ||
    Number(precio) < 0 ||
    !Number.isInteger(Number(stock)) ||
    Number(stock) < 0 ||
    !Number.isInteger(Number(id_categoria)) ||
    Number(id_categoria) <= 0
  ) {
    return res.status(400).json({
      error: "Los datos del producto no son válidos.",
    });
  }

  try {
    const [resultado] = await db.query(
      `UPDATE productos
       SET nombre = ?,
           descripcion = ?,
           precio = ?,
           stock = ?,
           id_categoria = ?
       WHERE id_producto = ?`,
      [
        nombre.trim(),
        descripcion,
        Number(precio),
        Number(stock),
        Number(id_categoria),
        id,
      ]
    );

    if (resultado.affectedRows === 0) {
      const [existentes] = await db.query(
        "SELECT id_producto FROM productos WHERE id_producto = ?",
        [id]
      );

      if (existentes.length === 0) {
        return res.status(404).json({
          error: "El producto no existe.",
        });
      }
    }

    res.json({
      mensaje: "Producto actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error al editar producto:", error.message);
    res.status(500).json({
      error: "No se pudo actualizar el producto. Verifica la categoría.",
    });
  }
});


/* Consultar todos los productos para administración,
   incluidos los inactivos */
app.get("/api/productos/admin", async (req, res) => {
  try {
    const [productos] = await db.query(`
      SELECT
        p.id_producto,
        p.nombre,
        p.descripcion,
        p.precio,
        p.stock,
        p.id_categoria,
        p.activo,
        c.nombre AS categoria
      FROM productos p
      LEFT JOIN categorias c
        ON p.id_categoria = c.id_categoria
      ORDER BY p.nombre ASC
    `);

    res.json(productos);
  } catch (error) {
    console.error(
      "Error al consultar productos para administración:",
      error.message
    );

    res.status(500).json({
      error: "No se pudieron consultar los productos para administración.",
    });
  }
});


/* Activar o desactivar un producto */
app.patch("/api/productos/:id/estado", async (req, res) => {
  const id = Number(req.params.id);
  const { activo } = req.body;

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    ![0, 1, true, false].includes(activo)
  ) {
    return res.status(400).json({
      error: "Debes indicar un producto válido y su estado (activo o inactivo).",
    });
  }

  try {
    const [resultado] = await db.query(
      `UPDATE productos
       SET activo = ?
       WHERE id_producto = ?`,
      [activo === true || activo === 1 ? 1 : 0, id]
    );

    if (resultado.affectedRows === 0) {
      const [existentes] = await db.query(
        "SELECT id_producto FROM productos WHERE id_producto = ?",
        [id]
      );

      if (existentes.length === 0) {
        return res.status(404).json({
          error: "El producto no existe.",
        });
      }
    }

    res.json({
      mensaje:
        activo === true || activo === 1
          ? "Producto activado correctamente."
          : "Producto desactivado correctamente.",
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error.message);
    res.status(500).json({
      error: "No se pudo cambiar el estado del producto.",
    });
  }
});


app.get("/api/diagnostico", (req, res) => {
  res.json({
    mensaje: "La API de KFE responde correctamente",
    rutaVentas: "/api/ventas",
    metodo: "POST",
  });
});


/* Registrar una venta */
app.post("/api/ventas", async (req, res) => {

  const { productos, metodo_pago } = req.body;

  if (
    !Array.isArray(productos) ||
    productos.length === 0 ||
    !metodo_pago
  ) {
    return res.status(400).json({
      error: "Debes enviar productos y un método de pago.",
    });
  }

  const conexion = await db.getConnection();

  try {
    await conexion.beginTransaction();

    let total = 0;
    const detalles = [];

    // Validar productos, precios e inventario
    for (const item of productos) {
      const id_producto = Number(item.id_producto);
      const cantidad = Number(item.cantidad);

      if (
        !Number.isInteger(id_producto) ||
        id_producto <= 0 ||
        !Number.isInteger(cantidad) ||
        cantidad <= 0
      ) {
        throw new Error("Producto o cantidad inválidos.");
      }

      const [filas] = await conexion.query(
        `SELECT id_producto, nombre, precio, stock
         FROM productos
         WHERE id_producto = ? AND activo = 1
         FOR UPDATE`,
        [id_producto]
      );

      if (filas.length === 0) {
        throw new Error(`El producto ${id_producto} no existe o está inactivo.`);
      }

      const producto = filas[0];

      if (producto.stock < cantidad) {
        throw new Error(
          `Inventario insuficiente para ${producto.nombre}. Disponible: ${producto.stock}.`
        );
      }

      const precio = Number(producto.precio);
      const subtotal = Math.round(precio * cantidad * 100) / 100;

      total += subtotal;

      detalles.push({
        id_producto,
        cantidad,
        precio_unitario: precio,
        subtotal,
      });
    }

    total = Math.round(total * 100) / 100;

    // Crear la venta
    const [resultadoVenta] = await conexion.query(
      `INSERT INTO ventas (total, metodo_pago)
       VALUES (?, ?)`,
      [total, metodo_pago]
    );

    const id_venta = resultadoVenta.insertId;

    // Guardar detalles y descontar inventario
    for (const detalle of detalles) {
      await conexion.query(
        `INSERT INTO detalle_venta
         (id_venta, id_producto, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id_venta,
          detalle.id_producto,
          detalle.cantidad,
          detalle.precio_unitario,
          detalle.subtotal,
        ]
      );

      await conexion.query(
        `UPDATE productos
         SET stock = stock - ?
         WHERE id_producto = ?`,
        [detalle.cantidad, detalle.id_producto]
      );
    }

    await conexion.commit();

    res.status(201).json({
      mensaje: "Venta registrada correctamente.",
      id_venta,
      total,
    });
  } catch (error) {
    await conexion.rollback();

    console.error("Error al registrar venta:", error.message);

    res.status(400).json({
      error: error.message || "No se pudo registrar la venta.",
    });
  } finally {
    conexion.release();
  }
});
   
// Reporte de productos vendidos por periodo
app.get("/api/reportes/ventas", async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;

  const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

  if (
    !formatoFecha.test(fecha_inicio || "") ||
    !formatoFecha.test(fecha_fin || "") ||
    fecha_inicio > fecha_fin
  ) {
    return res.status(400).json({
      error: "Debes indicar un periodo de fechas válido."
    });
  }

  try {
    const [productos] = await db.query(
      `SELECT
          p.id_producto,
          p.nombre AS producto,
          SUM(d.cantidad) AS unidades_vendidas,
          SUM(d.subtotal) AS importe_total
       FROM detalle_venta d
       INNER JOIN ventas v
          ON v.id_venta = d.id_venta
       INNER JOIN productos p
          ON p.id_producto = d.id_producto
       WHERE v.fecha >= ?
         AND v.fecha < DATE_ADD(?, INTERVAL 1 DAY)
         AND v.estado = 'completada'
       GROUP BY p.id_producto, p.nombre
       ORDER BY unidades_vendidas DESC, importe_total DESC`,
      [fecha_inicio, fecha_fin]
    );

    const reporte = productos.map((p) => ({
      id_producto: p.id_producto,
      producto: p.producto,
      unidades_vendidas: Number(p.unidades_vendidas),
      importe_total: Number(p.importe_total)
    }));

    const totalVentas = reporte.reduce(
      (suma, p) => suma + p.importe_total,
      0
    );

    res.json({
      fecha_inicio,
      fecha_fin,
      total_ventas: Math.round(totalVentas * 100) / 100,
      productos: reporte,
      top3: reporte.slice(0, 3)
    });
  } catch (error) {
    console.error("Error al generar reporte:", error);
    res.status(500).json({
      error: "No se pudo generar el reporte de ventas."
    });
  }
});

// este englobara a todas las ventas en genral
app.get("/api/reportes/ventas/global", async (req, res) => {
  try {
    const [productos] = await db.query(`
      SELECT
        p.id_producto,
        p.nombre AS producto,
        SUM(d.cantidad) AS unidades_vendidas,
        SUM(d.subtotal) AS importe_total
      FROM detalle_venta d
      INNER JOIN ventas v
        ON v.id_venta = d.id_venta
      INNER JOIN productos p
        ON p.id_producto = d.id_producto
      WHERE v.estado = 'completada'
      GROUP BY p.id_producto, p.nombre
      ORDER BY unidades_vendidas DESC, importe_total DESC
    `);

    const reporte = productos.map((p) => ({
      id_producto: p.id_producto,
      producto: p.producto,
      unidades_vendidas: Number(p.unidades_vendidas),
      importe_total: Number(p.importe_total),
    }));

    res.json({
      total_ventas: Math.round(
        reporte.reduce((suma, p) => suma + p.importe_total, 0) * 100
      ) / 100,
      productos: reporte,
      top3: reporte.slice(0, 3),
    });
  } catch (error) {
    console.error("Error al generar reporte global:", error.message);
    res.status(500).json({
      error: "No se pudo generar el reporte global de ventas.",
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor KFE ejecutándose en http://localhost:${PORT}`);
});