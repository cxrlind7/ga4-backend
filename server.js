import express from 'express'
import cors from 'cors'
import {
  getBlogPageViews,
  getHomepageDailyViews,
  getRoutePageViews,
  getPersonPageViews,
  getBlogEventBreakdown,
} from './getAnalyticsData.js'

const app = express()
app.use(cors())

// Middleware para extraer fechas del query string
const getDates = (req) => {
  const { startDate, endDate } = req.query
  // Si no se proveen, usar '30daysAgo' como default
  return startDate && endDate
    ? { startDate, endDate }
    : { startDate: '30daysAgo', endDate: 'today' }
}

app.get('/api/routes-views', async (req, res) => {
  try {
    const paths = ['/about', '/blog', '/programs', '/login', '/live', '/gallery']
    console.log('Paths:', paths)
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
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.get('/api/person-views', async (req, res) => {
  try {
    const dateRange = getDates(req)
    const data = await getPersonPageViews(dateRange)
    // Convertir a arreglo ordenado por vistas descendentes
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
    const data = await getBlogEventBreakdown()
    res.json(data)
  } catch (error) {
    console.error('Error al obtener desglose de eventos del blog:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})

