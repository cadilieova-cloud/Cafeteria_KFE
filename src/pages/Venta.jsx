import { useEffect, useMemo, useState } from 'react'
import './Venta.css'
const API_URL = 'http://localhost:3000/api/productos'

const money = (amount) =>
  Number(amount).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  })

function Venta() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas las categorías')
  const [cart, setCart] = useState([])
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(API_URL, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('No se pudieron cargar los productos.')
        }

        const data = await response.json()

        const normalizedProducts = data.map((product) => ({
          id: product.id_producto,
          name: product.nombre,
          categoryId: product.id_categoria,
          category: product.categoria || 'Sin categoría',
          description: product.descripcion || '',
          price: Number(product.precio),
          stock: Number(product.stock),
        }))

        setProducts(normalizedProducts)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(
            'No se pudo conectar con la API. Comprueba que el servidor esté encendido.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => controller.abort()
  }, [])

  const categories = useMemo(
    () => [
      'Todas las categorías',
      ...new Set(products.map((product) => product.category)),
    ],
    [products],
  )

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase())

      const matchesCategory =
        category === 'Todas las categorías' ||
        product.category === category

      return matchesSearch && matchesCategory
    })
  }, [products, search, category])

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  function addToCart(product) {
    setMessage('')

    if (product.stock <= 0) {
      setMessage(`${product.name} no tiene existencias.`)
      return
    }

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id)
      const quantityInCart = existing ? existing.quantity : 0

      if (quantityInCart >= product.stock) {
        setMessage(`No hay más existencias de ${product.name}.`)
        return currentCart
      }

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...currentCart, { ...product, quantity: 1 }]
    })
  }

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

  function clearCart() {
    setCart([])
    setMessage('')
  }

  

async function checkout() {
  if (cart.length === 0) {
    setMessage('Agrega productos al ticket antes de cobrar.')
    return
  }

  if (processing) return

  setProcessing(true)
  setMessage('Procesando venta...')

  try {
    const respuesta = await fetch('http://localhost:3000/api/ventas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metodo_pago: 'Efectivo',
        productos: cart.map((item) => ({
          id_producto: item.id,
          cantidad: item.quantity,
        })),
      }),
    })

    const texto = await respuesta.text();

    console.log('Estado HTTP:', respuesta.status);
    console.log('Respuesta del servidor:', texto);

    const resultado = JSON.parse(texto);

    if (!respuesta.ok) {
      throw new Error(
        resultado.error || 'No se pudo registrar la venta.'
      )
    }

    setCart([])
    setMessage(
      `¡Venta #${resultado.id_venta} registrada correctamente! Total: ${money(resultado.total)}`
    )

    try {
      const respuestaProductos = await fetch(API_URL)

      if (respuestaProductos.ok) {
        const datos = await respuestaProductos.json()

        setProducts(
          datos.map((product) => ({
            id: product.id_producto,
            name: product.nombre,
            categoryId: product.id_categoria,
            category: product.categoria || 'Sin categoría',
            description: product.descripcion || '',
            price: Number(product.precio),
            stock: Number(product.stock),
          }))
        )
      }
    } catch (errorActualizacion) {
      console.error(
        'La venta se guardó, pero no se pudo actualizar el catálogo:',
        errorActualizacion
      )
    }
  } catch (error) {
    setMessage(`Error al cobrar: ${error.message}`)
  } finally {
    setProcessing(false)
  }
}


  return (
          <div className="pos-layout">
            <section className="catalog" aria-label="Catálogo de productos">
              <div className="catalog-filters">
                <input
                  type="search"
                  placeholder="Buscar producto..."
                  aria-label="Buscar producto"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                <select
                  aria-label="Filtrar por categoría"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {loading && <p>Cargando productos...</p>}

              {!loading && error && (
                <p className="no-products" role="alert">{error}</p>
              )}

              {!loading && !error && (
                <div className="product-grid">
                  {filteredProducts.map((product) => (
                    <button
                      type="button"
                      className="product-card"
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      title={product.description}
                    >
                      <span className="product-name">{product.name}</span>
                      <span className="product-category">
                        {product.category}
                      </span>
                      <span className="product-price">
                        {money(product.price)}
                      </span>
                      <span className="product-category">
                        Existencias: {product.stock}
                      </span>
                    </button>
                  ))}

                  {filteredProducts.length === 0 && (
                    <p className="no-products">
                      No se encontraron productos.
                    </p>
                  )}
                </div>
              )}
            </section>

            <aside className="ticket">
              <h2>Ticket</h2>

              <div className="ticket-items">
                {cart.length === 0 ? (
                  <p className="empty-ticket">
                    Toca un producto para agregarlo
                  </p>
                ) : (
                  cart.map((item) => (
                    <div className="ticket-item" key={item.id}>
                      <div className="ticket-item-info">
                        <strong>{item.name}</strong>
                        <span>{money(item.price)} c/u</span>
                      </div>

                      <div className="quantity-control">
                        <button
                          type="button"
                          aria-label={`Quitar una unidad de ${item.name}`}
                          onClick={() => changeQuantity(item.id, -1)}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Agregar una unidad de ${item.name}`}
                          onClick={() => changeQuantity(item.id, 1)}
                        >
                          +
                        </button>
                      </div>

                      <strong className="item-subtotal">
                        {money(item.price * item.quantity)}
                      </strong>
                    </div>
                  ))
                )}
              </div>

              <div className="ticket-bottom">
                <div className="ticket-total">
                  <span>Total</span>
                  <strong>{money(total)}</strong>
                </div>

                {message && (
                  <p className="ticket-message" role="status">
                    {message}
                  </p>
                )}          
                <div className="ticket-actions">
                  <button
                    type="button"
                    className="button-clear"
                    onClick={clearCart}
                  >
                    Vaciar
                  </button>

                  <button
                    type="button"
                    className="button-checkout"
                    onClick={checkout}
                    disabled={processing || cart.length === 0}
                  >
                    {processing ? 'Procesando...' : 'Cobrar'}
                  </button>
                </div>
              </div>
            </aside>
          </div>
  )
}

export default Venta
