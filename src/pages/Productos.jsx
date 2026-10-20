import { useEffect, useState } from 'react'
import './Productos.css'
const API_URL = 'http://localhost:3000/api/productos'

const money = (amount) =>
  Number(amount).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  })

function Productos({ products, setProducts }) {
  const [adminProducts, setAdminProducts] = useState([])
  const [categoriesAdmin, setCategoriesAdmin] = useState([])
  const [productForm, setProductForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '0',
    id_categoria: '',
  })
  const [editingId, setEditingId] = useState(null)
  const [adminMessage, setAdminMessage] = useState('')
  const [adminError, setAdminError] = useState('')
  const [savingProduct, setSavingProduct] = useState(false)
  const [adminSearch, setAdminSearch] = useState('')

  async function loadAdminProducts() {
    try {
      const response = await fetch(`${API_URL}/admin`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron cargar los productos.')
      }

      setAdminProducts(data)
      setAdminError('')
    } catch (error) {
      setAdminError(error.message)
    }
  }

  async function loadAdminCategories() {
    try {
      const response = await fetch('http://localhost:3000/api/categorias')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron cargar las categorías.')
      }

      setCategoriesAdmin(data)
    } catch (error) {
      setAdminError(error.message)
    }
  }

  async function openProductAdmin() {
    setAdminMessage('')
    setAdminError('')
    await Promise.all([loadAdminProducts(), loadAdminCategories()])
  }

  useEffect(() => {
    openProductAdmin()
  }, [])

  function resetProductForm() {
    setProductForm({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '0',
      id_categoria: '',
    })
    setEditingId(null)
  }

  function editProduct(product) {
    setProductForm({
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      precio: String(product.precio ?? ''),
      stock: String(product.stock ?? 0),
      id_categoria: String(product.id_categoria ?? ''),
    })
    setEditingId(product.id_producto)
    setAdminMessage('')
    setAdminError('')
  }

  async function refreshCatalog() {
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error('No se pudo actualizar el catálogo.')
    }

    const data = await response.json()

    setProducts(data.map((product) => ({
      id: product.id_producto,
      name: product.nombre,
      categoryId: product.id_categoria,
      category: product.categoria || 'Sin categoría',
      description: product.descripcion || '',
      price: Number(product.precio),
      stock: Number(product.stock),
    })))
  }

  async function saveProduct(event) {
    event.preventDefault()
    setAdminMessage('')
    setAdminError('')

    const precio = Number(productForm.precio)
    const stock = Number(productForm.stock)

    if (!productForm.nombre.trim()) {
      setAdminError('Escribe el nombre del producto.')
      return
    }

    if (productForm.precio === '' || !Number.isFinite(precio) || precio < 0) {
      setAdminError('Escribe un precio válido.')
      return
    }

    if (productForm.stock === '' || !Number.isInteger(stock) || stock < 0) {
      setAdminError('Las existencias deben ser un entero igual o mayor que cero.')
      return
    }

    if (!productForm.id_categoria) {
      setAdminError('Selecciona una categoría.')
      return
    }

    setSavingProduct(true)

    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: productForm.nombre.trim(),
          descripcion: productForm.descripcion.trim(),
          precio,
          stock,
          id_categoria: Number(productForm.id_categoria),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'No se pudo guardar el producto.')
      }

      setAdminMessage(
        editingId
          ? 'Producto actualizado correctamente.'
          : 'Producto registrado correctamente.',
      )

      resetProductForm()
      await Promise.all([loadAdminProducts(), refreshCatalog()])
    } catch (error) {
      setAdminError(error.message)
    } finally {
      setSavingProduct(false)
    }
  }

  async function toggleProductStatus(product) {
    setAdminMessage('')
    setAdminError('')

    const nuevoEstado = Number(product.activo) === 1 ? 0 : 1

    try {
      const response = await fetch(`${API_URL}/${product.id_producto}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'No se pudo cambiar el estado.')
      }

      setAdminMessage(result.mensaje || 'Estado actualizado correctamente.')
      await Promise.all([loadAdminProducts(), refreshCatalog()])
    } catch (error) {
      setAdminError(error.message)
    }
  }

  const filteredAdminProducts = adminProducts.filter((product) =>
    `${product.nombre} ${product.descripcion || ''}`
      .toLowerCase()
      .includes(adminSearch.toLowerCase()),
  )

  return (
    <section className="products-admin-page">
      <div className="reports-header">
        <div>
          <h2>Administración de productos</h2>
          <p>Registra, edita y administra el catálogo de KFE.</p>
        </div>
        <button type="button" className="button-clear" onClick={openProductAdmin}>
          Actualizar catálogo
        </button>
      </div>

      <form className="product-admin-form" onSubmit={saveProduct}>
        <h3>{editingId ? 'Editar producto' : 'Registrar producto'}</h3>

        <label>
          Nombre
          <input
            value={productForm.nombre}
            onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
            required
          />
        </label>

        <label>
          Descripción
          <input
            value={productForm.descripcion}
            onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })}
          />
        </label>

        <label>
          Precio
          <input
            type="number"
            min="0"
            step="0.01"
            value={productForm.precio}
            onChange={(e) => setProductForm({ ...productForm, precio: e.target.value })}
            required
          />
        </label>

        <label>
          Existencias
          <input
            type="number"
            min="0"
            step="1"
            value={productForm.stock}
            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
            required
          />
        </label>

        <label>
          Categoría
          <select
            value={productForm.id_categoria}
            onChange={(e) => setProductForm({ ...productForm, id_categoria: e.target.value })}
            required
          >
            <option value="">Selecciona una categoría</option>
            {categoriesAdmin.map((categoria) => (
              <option key={categoria.id_categoria} value={categoria.id_categoria}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>

        <div className="product-admin-actions">
          <button type="submit" className="button-checkout" disabled={savingProduct}>
            {savingProduct
              ? 'Guardando...'
              : editingId
                ? 'Guardar cambios'
                : 'Registrar producto'}
          </button>
          {editingId && (
            <button type="button" className="button-clear" onClick={resetProductForm}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {adminMessage && <p role="status">{adminMessage}</p>}
      {adminError && <p className="report-error" role="alert">{adminError}</p>}

      <section className="report-section">
        <h3>Catálogo de productos</h3>
        <input
          type="search"
          placeholder="Buscar producto..."
          value={adminSearch}
          onChange={(e) => setAdminSearch(e.target.value)}
        />

        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Existencias</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdminProducts.map((product) => (
                <tr key={product.id_producto}>
                  <td>{product.nombre}</td>
                  <td>{product.categoria || 'Sin categoría'}</td>
                  <td>{money(product.precio)}</td>
                  <td>{product.stock}</td>
                  <td>{Number(product.activo) === 1 ? 'Activo' : 'Inactivo'}</td>
                  <td>
                    <button type="button" onClick={() => editProduct(product)}>Editar</button>
                    {' '}
                    <button type="button" onClick={() => toggleProductStatus(product)}>
                      {Number(product.activo) === 1 ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAdminProducts.length === 0 && (
                <tr><td colSpan="6">No se encontraron productos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

export default Productos
