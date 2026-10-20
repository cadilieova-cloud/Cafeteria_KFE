import { useState } from 'react'
import './Gerencia.css'

const money = (amount) =>
  Number(amount).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  })

function Gerencia() {
  const [fechaInicio, setFechaInicio] = useState('2026-10-01')
  const [fechaFin, setFechaFin] = useState('2026-10-15')
  const [reporte, setReporte] = useState(null)
  const [cargandoReporte, setCargandoReporte] = useState(false)
  const [errorReporte, setErrorReporte] = useState('')
  const [reporteGlobal, setReporteGlobal] = useState(null)
  const [cargandoGlobal, setCargandoGlobal] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState('')

  async function consultarReporte() {
    if (!fechaInicio || !fechaFin) {
      setErrorReporte('Selecciona ambas fechas.')
      return
    }

    if (fechaInicio > fechaFin) {
      setErrorReporte('La fecha inicial no puede ser posterior a la fecha final.')
      return
    }

    setCargandoReporte(true)
    setErrorReporte('')

    try {
      const parametros = new URLSearchParams({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      })
      const respuesta = await fetch(`http://localhost:3000/api/reportes/ventas?${parametros}`)
      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo consultar el reporte.')
      }

      setReporte(datos)
    } catch (error) {
      setErrorReporte(error.message)
      setReporte(null)
    } finally {
      setCargandoReporte(false)
    }
  }

  async function consultarReporteGlobal() {
    setCargandoGlobal(true)
    setErrorGlobal('')

    try {
      const respuesta = await fetch('http://localhost:3000/api/reportes/ventas/global')
      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo consultar el reporte global.')
      }

      setReporteGlobal(datos)
    } catch (error) {
      setErrorGlobal(error.message)
      setReporteGlobal(null)
    } finally {
      setCargandoGlobal(false)
    }
  }

  function renderChart(productos) {
    if (productos.length === 0) return <p>No hay datos para graficar.</p>

    const maximo = Math.max(...productos.map((producto) => Number(producto.importe_total)), 1)

    return (
      <div className="report-chart">
        {productos.map((producto) => {
          const porcentaje = (Number(producto.importe_total) / maximo) * 100
          return (
            <div className="chart-row" key={producto.id_producto}>
              <span className="chart-label">
                {producto.producto} (ID {producto.id_producto})
              </span>
              <div className="chart-track">
                <div className="chart-bar" style={{ width: `${porcentaje}%` }} />
              </div>
              <strong>{money(producto.importe_total)}</strong>
            </div>
          )
        })}
      </div>
    )
  }

  function renderTop3(productos, emptyMessage) {
    if (productos.length === 0) return <p>{emptyMessage}</p>

    return (
      <div className="report-top">
        {productos.map((producto, index) => (
          <article className="report-card" key={producto.id_producto}>
            <span>Puesto {index + 1}</span>
            <strong>{producto.producto}</strong>
            <span>{producto.unidades_vendidas} unidades vendidas</span>
            <span>{money(producto.importe_total)}</span>
          </article>
        ))}
      </div>
    )
  }

  function renderSummary(datos, global = false) {
    return (
      <div className="report-summary">
        <article className="report-card">
          <span>{global ? 'Importe global vendido' : 'Importe vendido'}</span>
          <strong>{money(datos.total_ventas)}</strong>
        </article>
        <article className="report-card">
          <span>{global ? 'Productos diferentes vendidos' : 'Productos diferentes'}</span>
          <strong>{datos.productos.length}</strong>
        </article>
        <article className="report-card">
          <span>{global ? 'Unidades globales vendidas' : 'Unidades vendidas'}</span>
          <strong>
            {datos.productos.reduce((total, producto) => total + Number(producto.unidades_vendidas), 0)}
          </strong>
        </article>
      </div>
    )
  }

  function renderProductsTable(productos) {
    return (
      <div className="report-table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Unidades vendidas</th>
              <th>Importe total</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id_producto}>
                <td>
                  {producto.producto}
                  <small>ID: {producto.id_producto}</small>
                </td>
                <td>{producto.unidades_vendidas}</td>
                <td>{money(producto.importe_total)}</td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr><td colSpan="3">No hay productos vendidos en este periodo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <section className="reports-page">
      <div className="reports-header">
        <div>
          <h2>Reportes de ventas</h2>
          <p>Consulta los productos vendidos por periodo.</p>
        </div>
      </div>

      <div className="report-filters">
        <label>
          Fecha inicial
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </label>
        <label>
          Fecha final
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </label>
        <button type="button" className="button-checkout" onClick={consultarReporte} disabled={cargandoReporte}>
          {cargandoReporte ? 'Consultando...' : 'Consultar reporte'}
        </button>
      </div>

      {errorReporte && <p className="report-error" role="alert">{errorReporte}</p>}

      {reporte && (
        <>
          {renderSummary(reporte)}
          <section className="report-section">
            <h3>Top 3 de productos más vendidos</h3>
            {renderTop3(reporte.top3, 'No hay ventas en este periodo.')}
          </section>
          <section className="report-section">
            <h3>Ventas por producto</h3>
            {renderChart(reporte.productos)}
          </section>
          <section className="report-section">
            <h3>Detalle de productos vendidos</h3>
            {renderProductsTable(reporte.productos)}
          </section>
        </>
      )}

      <section className="report-section">
        <h2>Resumen global de ventas</h2>
        <p>Todas las ventas completadas registradas desde el inicio de KFE, sin importar las fechas seleccionadas arriba.</p>
        <button type="button" className="button-checkout" onClick={consultarReporteGlobal} disabled={cargandoGlobal}>
          {cargandoGlobal ? 'Consultando reporte global...' : 'Consultar reporte global'}
        </button>
        {errorGlobal && <p className="report-error" role="alert">{errorGlobal}</p>}
        {reporteGlobal && (
          <>
            {renderSummary(reporteGlobal, true)}
            <section className="report-section">
              <h3>Top 3 global de productos más vendidos</h3>
              {renderTop3(reporteGlobal.top3, 'Aún no hay ventas completadas registradas.')}
            </section>
            <section className="report-section">
              <h3>Gráfica global de ventas por producto</h3>
              {renderChart(reporteGlobal.productos)}
            </section>
            <section className="report-section">
              <h3>Detalle global de productos vendidos</h3>
              {renderProductsTable(reporteGlobal.productos)}
            </section>
          </>
        )}
      </section>
    </section>
  )
}

export default Gerencia
