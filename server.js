import express from 'express'
import cors from 'cors'
import {
  getBlogPageViews,
  getHomepageViewsDaily,
  getRoutesViews,
  getPersonViews,
  getBlogEventBreakdown,
} from './getAnalyticsData.js'

const app = express()
const port = process.env.PORT || 3001

// Configuración de CORS más permisiva para desarrollo/producción
app.use(
  cors({
    origin: '*', // En producción, idealmente restringe esto a tu dominio frontend
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

// Ruta raíz para Health Check de Railway
app.get('/', (req, res) => {
  res.status(200).send('Backend de Analíticas funcionando correctamente.')
})

// Endpoint 1: Vistas de Blogs
app.get('/api/blog-views', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const data = await getBlogPageViews(startDate, endDate)
    res.json(data)
  } catch (error) {
    console.error('Error al obtener vistas de blogs:', error)
    res.status(500).json({ error: 'Error al obtener vistas de blogs' })
  }
})

// Endpoint 2: Vistas de Homepage (Diarias)
app.get('/api/homepage-views', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const data = await getHomepageViewsDaily(startDate, endDate)
    res.json(data)
  } catch (error) {
    console.error('Error al obtener vistas de inicio:', error)
    res.status(500).json({ error: 'Error al obtener vistas de inicio' })
  }
})

// Endpoint 3: Vistas de Rutas (Secciones)
app.get('/api/routes-views', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const data = await getRoutesViews(startDate, endDate)
    res.json(data)
  } catch (error) {
    console.error('Error al obtener vistas de rutas:', error)
    res.status(500).json({ error: 'Error al obtener vistas de rutas' })
  }
})

// Endpoint 4: Vistas de Especialistas
// MODIFICADO: Ahora acepta personId
app.get('/api/person-views', async (req, res) => {
  try {
    // Extraemos personId del query string también
    const { startDate, endDate, personId } = req.query
    // Pasamos el personId a la función
    const data = await getPersonViews(startDate, endDate, personId)
    res.json(data)
  } catch (error) {
    console.error('Error al obtener vistas de especialistas:', error)
    res.status(500).json({ error: 'Error al obtener vistas de especialistas' })
  }
})

app.get('/api/blog-events-breakdown', async (req, res) => {
  try {
    const data = await getBlogEventBreakdown()
    res.json(data)
  } catch (error) {
    console.error('Error al obtener desglose de eventos del blog:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`)
})
