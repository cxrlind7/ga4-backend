import { BetaAnalyticsDataClient } from '@google-analytics/data'

// Asegúrate de que la ruta a tus credenciales sea correcta en tu servidor
const analyticsDataClient = new BetaAnalyticsDataClient({
  // Usa './' para indicar "en esta misma carpeta"
  keyFilename: './crianzasana-c33aa-694d0980b439.json',
})

const PROPERTY_ID = '483239794'

// Helper para manejar rangos de fecha por defecto
const defaultRange = { startDate: '30daysAgo', endDate: 'today' }

export async function getBlogPageViews(dateRange = defaultRange) {
  console.log(`📊 Fetching Blog Views for range: ${dateRange.startDate} to ${dateRange.endDate}`)

  // 1️⃣ Consulta Principal: Métricas clave para el rango seleccionado
  const [pageViewsResponse] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [dateRange],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' }, // [0] Vistas
      { name: 'activeUsers' }, // [1] Usuarios
      { name: 'screenPageViewsPerUser' }, // [2] Vistas/Usuario
      { name: 'userEngagementDuration' }, // [3] Tiempo total (segundos)
      { name: 'eventCount' }, // [4] Total Eventos
      { name: 'engagementRate' }, // [5] Tasa de interacción (Nuevo!)
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' },
      },
    },
  })

  // 2️⃣ Consulta Secundaria: Eventos 'share_blog' para el MISMO rango
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

  // 3️⃣ Consulta Terciaria: Datos diarios para la gráfica de línea (Sparkline)
  // Esta SIEMPRE debe ser los últimos 7 días para que la gráfica pequeña se vea consistente,
  // independientemente del filtro principal.
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

  // Procesar métricas principales
  pageViewsResponse.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    // Validar que sea un blog real y no una ruta de prueba
    if (path.startsWith('/blog/') && path.split('/').length > 2) {
      const values = row.metricValues.map((v) => parseFloat(v.value))
      viewsByPath[path] = {
        visits: values[0],
        users: values[1],
        viewsPerUser: parseFloat(values[2]).toFixed(1),
        // Calculamos el tiempo promedio por sesión en segundos
        avgEngagementTime: values[1] > 0 ? Math.round(values[3] / values[1]) : 0,
        totalEvents: values[4],
        engagementRate: (parseFloat(values[5]) * 100).toFixed(0), // Convertir a porcentaje
        shares: 0, // Inicializar
        daily: {}, // Inicializar
      }
    }
  })

  // Procesar shares
  shareEventsResponse.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    if (viewsByPath[path]) {
      viewsByPath[path].shares = parseInt(row.metricValues[0].value)
    }
  })

  // Procesar daily (últimos 7 días fijos)
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
      filter: { fieldName: 'pagePath', stringFilter: { matchType: 'EXACT', value: '/' } },
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
          filter: { fieldName: 'pagePath', stringFilter: { matchType: 'EXACT', value: path } },
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
          filter: { fieldName: 'pagePath', stringFilter: { matchType: 'EXACT', value: path } },
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

