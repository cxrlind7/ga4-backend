import express from 'express'
import cors from 'cors'
// ✅ CORRECCIÓN IMPORTANTE: Ruta relativa correcta para archivos en la misma carpeta
import {
  getBlogPageViews,
  getHomepageDailyViews,
  getRoutePageViews,
  getPersonPageViews,
  getBlogEventBreakdown,
} from './getAnalyticsData.js'

const app = express()
app.use(cors())

// --- AGREGA ESTO AQUÍ ---
// Ruta raíz para el Health Check de Railway.
// Esto le dice a Railway que el servidor está vivo.
app.get('/', (req, res) => {
  res.status(200).send('🤖 GA4 Backend is running OK!')
})

// Middleware helper para extraer fechas del query string de la URL
const getDates = (req) => {
  const { startDate, endDate } = req.query
  // Si no se proveen, usar '30daysAgo' como default
  return startDate && endDate
    ? { startDate, endDate }
    : { startDate: '30daysAgo', endDate: 'today' }
}

// --- RUTAS DE LA API ---

app.get('/api/routes-views', async (req, res) => {
  try {
    // Rutas estáticas principales a monitorear
    const paths = ['/about', '/blog', '/programs', '/login', '/live', '/gallery']
    const dateRange = getDates(req)
    const data = await getRoutePageViews(paths, dateRange)
    res.json(data)
  } catch (error) {
    console.error('Error al obtener vistas de rutas:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.get('/api/blog-views', async (req, res) => {
  try {
    const dateRange = getDates(req)
    const data = await getBlogPageViews(dateRange)
    res.json(data)
  } catch (error) {
    console.error('Error al obtener vistas del blog:', error)
    // Es útil ver el error completo en los logs de Railway
    console.error(error.stack)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.get('/api/person-views', async (req, res) => {
  try {
    const dateRange = getDates(req)
    const data = await getPersonPageViews(dateRange)
    // Convertir a arreglo ordenado por vistas descendentes para el frontend
    const sorted = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .map(([path, views]) => ({ path, views }))
    res.json(sorted)
  } catch (error) {
    console.error('Error al obtener vistas de personas:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.get('/api/homepage-views', async (req, res) => {
  try {
    const dateRange = getDates(req)
    const data = await getHomepageDailyViews(dateRange)
    res.json(data)
  } catch (error) {
    console.error('Error al obtener vistas de la página principal:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.get('/api/blog-events-breakdown', async (req, res) => {
  try {
    // Esta función usa un rango histórico fijo, no depende del query string
    const data = await getBlogEventBreakdown()
    res.json(data)
  } catch (error) {
    console.error('Error al obtener desglose de eventos del blog:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Puerto para Railway (ellos asignan PORT automáticamente) o 3001 para local
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`)
})

