import { BetaAnalyticsDataClient } from '@google-analytics/data'

// ==========================================
// CONFIGURACIÓN DE CREDENCIALES (MODO SEGURO)
// ==========================================
// Verificamos que la variable de entorno con el JSON de credenciales exista en Railway.
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  console.error(
    '❌ ERROR FATAL: La variable de entorno GOOGLE_APPLICATION_CREDENTIALS_JSON no está definida.'
  )
  console.error(
    'Asegúrate de añadir el contenido de tu archivo JSON de credenciales en las variables de entorno de Railway.'
  )
  process.exit(1)
}

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
})

const PROPERTY_ID = '483239794'

// Helper para manejar rangos de fecha por defecto
const defaultRange = { startDate: '30daysAgo', endDate: 'today' }

// ==========================================
// FUNCIONES DE OBTENCIÓN DE DATOS
// ==========================================

export async function getBlogPageViews(dateRange = defaultRange) {
  console.log(
    `📊 Fetching Blog Views for range: ${dateRange.startDate} to ${dateRange.endDate}`
  )

  // 1️⃣ Consulta Principal: Métricas clave
  const [pageViewsResponse] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [dateRange],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' }, // [0] Vistas totales
      { name: 'activeUsers' }, // [1] Usuarios únicos
      { name: 'screenPageViewsPerUser' }, // [2] Vistas promedio por usuario
      { name: 'userEngagementDuration' }, // [3] Tiempo total de interacción (segundos sumados de todos)
      { name: 'eventCount' }, // [4] Total Eventos
      { name: 'engagementRate' }, // [5] Tasa de interacción
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' },
      },
    },
  })

  // 2️⃣ Consulta Secundaria: Eventos 'share_blog'
  const [shareEventsResponse] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [dateRange],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'pagePath',
              stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' },
            },
          },
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: { matchType: 'EXACT', value: 'share_blog' },
            },
          },
        ],
      },
    },
  })

  // 3️⃣ Consulta Terciaria: Datos diarios (últimos 7 días fijos para sparkline)
  const [dailyResponse] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }, { name: 'date' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' },
      },
    },
  })

  const viewsByPath = {}

  // --- PROCESAMIENTO DE DATOS ---

  // 1. Procesar métricas principales (CORREGIDO)
  pageViewsResponse.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    // Validar que sea un blog real y no una ruta de prueba o raíz
    if (path.startsWith('/blog/') && path.split('/').length > 2) {
      // Extraemos los valores usando nombres claros para no confundir índices
      const visits = parseFloat(row.metricValues[0].value)
      const users = parseFloat(row.metricValues[1].value)
      const viewsPerUser = parseFloat(row.metricValues[2].value)
      const totalEngagementTimeSeconds = parseFloat(row.metricValues[3].value)
      const totalEvents = parseFloat(row.metricValues[4].value)
      const engagementRateRaw = parseFloat(row.metricValues[5].value)

      viewsByPath[path] = {
        visits: visits,
        users: users,
        viewsPerUser: viewsPerUser.toFixed(1),
        // ✅ CÁLCULO CORREGIDO: Tiempo promedio por VISITA (sesión).
        // Dividimos el tiempo total entre el número de visitas.
        avgEngagementTime:
          visits > 0 ? Math.round(totalEngagementTimeSeconds / visits) : 0,
        totalEvents: totalEvents,
        engagementRate: (engagementRateRaw * 100).toFixed(0), // Convertir a porcentaje
        shares: 0, // Se llenará después
        daily: {}, // Se llenará después
      }
    }
  })

  // 2. Procesar shares
  shareEventsResponse.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    if (viewsByPath[path]) {
      viewsByPath[path].shares = parseInt(row.metricValues[0].value)
    }
  })

  // 3. Procesar daily (últimos 7 días)
  dailyResponse.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    const date = row.dimensionValues[1].value
    if (viewsByPath[path]) {
      viewsByPath[path].daily[date] = parseInt(row.metricValues[0].value)
    }
  })

  return viewsByPath
}

export async function getHomepageDailyViews(dateRange = defaultRange) {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [dateRange],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: { matchType: 'EXACT', value: '/' },
      },
    },
  })

  const data = {}
  response.rows?.forEach((row) => {
    data[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value)
  })
  return data
}

export async function getRoutePageViews(paths = [], dateRange = defaultRange) {
  const validPaths = Array.isArray(paths)
    ? paths.filter((p) => typeof p === 'string' && p.trim() !== '')
    : []
  if (!validPaths.length) return {}

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [dateRange],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      orGroup: {
        expressions: validPaths.map((path) => ({
          filter: {
            fieldName: 'pagePath',
            stringFilter: { matchType: 'EXACT', value: path },
          },
        })),
      },
    },
  })

  const data = {}
  response.rows?.forEach((row) => {
    data[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value)
  })
  return data
}

export async function getPersonPageViews(dateRange = defaultRange) {
  const personPaths = Array.from({ length: 9 }, (_, i) => `/person/${i + 1}`)
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [dateRange],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      orGroup: {
        expressions: personPaths.map((path) => ({
          filter: {
            fieldName: 'pagePath',
            stringFilter: { matchType: 'EXACT', value: path },
          },
        })),
      },
    },
  })

  const data = {}
  response.rows?.forEach((row) => {
    data[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value)
  })
  return data
}

export async function getBlogEventBreakdown() {
  // Usamos un rango amplio fijo para el breakdown histórico
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '2020-08-15', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
  })

  const breakdown = {}

  response.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    const event = row.dimensionValues[1].value
    const count = parseInt(row.metricValues[0].value)

    if (path.startsWith('/blog/')) {
      if (!breakdown[path]) breakdown[path] = {}
      breakdown[path][event] = count
    }
  })

  return breakdown
}
