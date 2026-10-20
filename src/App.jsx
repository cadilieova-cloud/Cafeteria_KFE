import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Venta from './pages/Venta.jsx'
import Gerencia from './pages/Gerencia.jsx'
import Productos from './pages/Productos.jsx'


const API_URL = 'http://localhost:3000/api/productos'


function App() {
  const [products, setProducts] = useState([])//-->Prudcuto igual que venta
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePage, setActivePage] = useState('Venta')//->Este abre la pagina en ventas, es decir si lo quitas no jala


  function changeQuantity(id, amount) {
    setMessage('')

    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id !== id) return item

          const nextQuantity = item.quantity + amount

          if (nextQuantity > item.stock) {
            setMessage(`Stock insuficiente para ${item.name}.`)
            return item
          }

          return { ...item, quantity: nextQuantity }
        })
        .filter((item) => item.quantity > 0),
    )
  }  
  
  return (
    <div className="pos-app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">K</div>
          <div className="brand-text">
            <strong>KFE</strong>
            <span>Cafetería</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {['Venta', 'Productos', 'Gerencia'].map((page) => (
            <button
              key={page}
              type="button"
              className={`nav-link ${activePage === page ? 'active' : ''}`}
              onClick={() => setActivePage(page)}
            >
              {page}
            </button>
          ))}
        </nav>

        <p className="sidebar-footer">
          Conectado.
          <br />
          MySQL.
        </p>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <h1>
            {activePage === 'Venta' ? 'Punto de venta' : activePage}
          </h1>
          <span className="current-time">
            {new Date().toLocaleTimeString('es-MX', {
              weekday: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </header>

            {activePage === 'Venta' ? (
              <Venta />
             ) : activePage === 'Productos' ? (
              <Productos setProducts={setProducts} />
            ) : activePage === 'Gerencia' ? (
              <Gerencia />   
            ) : (
              <section className="placeholder-page">
                <h2>{activePage}</h2>
                <p>Selecciona una sección del menú.</p>
                <button
                  type="button"
                  className="button-checkout"
                  onClick={() => setActivePage('Venta')}
                >
                  Volver al punto de venta
                </button>
              </section>
            )}

      </main>
    </div>
  )
}

export default App

