// server/server.js
import express from 'express';
import cors from 'cors';
import {
  getBlogPageViews,
  getHomepageViewsDaily,
  getRoutesViews,
  getPersonViews,
} from './getAnalyticsData.js';

const app = express();
const port = process.env.PORT || 8080;

// Configuración de CORS
app.use(
  cors({
    origin: '*', // Permite acceso desde cualquier origen (útil para desarrollo)
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Ruta raíz para Health Check de Railway (IMPORTANTE para evitar 502 en despliegue)
app.get('/', (req, res) => {
  res.status(200).send('Backend de Analíticas funcionando correctamente.');
});

// --- ENDPOINTS DE LA API ---

// Endpoint 1: Vistas de Blogs (con filtros de fecha)
app.get('/api/blog-views', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getBlogPageViews(startDate, endDate);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener vistas de blogs' });
  }
});

// Endpoint 2: Vistas de Homepage (con filtros de fecha)
app.get('/api/homepage-views', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getHomepageViewsDaily(startDate, endDate);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener vistas de inicio' });
  }
});

// Endpoint 3: Vistas de Rutas (con filtros de fecha)
app.get('/api/routes-views', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getRoutesViews(startDate, endDate);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener vistas de rutas' });
  }
});

// Endpoint 4: Vistas de Especialistas (con filtros de fecha y personId)
app.get('/api/person-views', async (req, res) => {
  try {
    // Extraemos los parámetros del query string
    const { startDate, endDate, personId } = req.query;
    // Pasamos los tres parámetros a la función
    const data = await getPersonViews(startDate, endDate, personId);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener vistas de especialistas' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
