import { BetaAnalyticsDataClient } from '@google-analytics/data'
//commentt
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  console.error('❌ Variable de entorno GOOGLE_APPLICATION_CREDENTIALS_JSON no está definida.')
  process.exit(1)
}

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
})

const PROPERTY_ID = '483239794'

export async function getBlogPageViews() {
  // 1️⃣ Consulta: visitas totales y tiempo de lectura promedio
  const [pageViewsResponse] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '2020-08-15', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' }, // ✅ Vistas
      { name: 'activeUsers' }, // ✅ Usuarios activos
      { name: 'screenPageViewsPerUser' }, // ✅ Vistas por usuario
      { name: 'userEngagementDuration' }, // ✅ Tiempo total de interacción
      { name: 'eventCount' }, // ✅ Número de eventos
    ],
  })

  // 2️⃣ Consulta: solo eventos 'share_blog'
  const [shareEventsResponse] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '2015-08-15', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          matchType: 'EXACT',
          value: 'share_blog',
        },
      },
    },
  })

  // 3️⃣ Consulta: visitas diarias por fecha
  const [dailyResponse] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }, { name: 'date' }],
    metrics: [{ name: 'screenPageViews' }],
  })

  const viewsByPath = {}

  pageViewsResponse.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    const values = row.metricValues.map((v) => parseFloat(v.value))

    if (path.startsWith('/blog/')) {
      viewsByPath[path] = {
        visits: values[0],
        users: values[1],
        viewsPerUser: values[2].toFixed(2),
        avgEngagementPerUser: values[1] > 0 ? Math.round(values[3] / values[1]) : 0,
        avgEngagementPerVisit: values[0] > 0 ? Math.round(values[3] / values[0]) : 0,
        readTime: values[0] > 0 ? Math.round(values[3] / values[0] / 1000) : 0, // segundos
        totalEvents: values[4],
        daily: {},
      }
    }
  })

  // Procesar eventos 'share_blog'
  shareEventsResponse.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    const shares = parseInt(row.metricValues[0].value)

    if (viewsByPath[path]) {
      viewsByPath[path].shares = shares
      const v = viewsByPath[path].visits
      viewsByPath[path].interactionRate = v > 0 ? Math.round((shares / v) * 100) : 0
    }
  })

  // Procesar visitas diarias
  dailyResponse.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    const date = row.dimensionValues[1].value
    const count = parseInt(row.metricValues[0].value)

    if (path.startsWith('/blog/')) {
      if (!viewsByPath[path]) {
        viewsByPath[path] = {
          visits: 0,
          averageReadTime: 0,
          shares: 0,
          interactionRate: 0,
          daily: {},
        }
      }

      if (!viewsByPath[path].daily) {
        viewsByPath[path].daily = {}
      }

      viewsByPath[path].daily[date] = count
    }
  })

  return viewsByPath
}

export async function getHomepageDailyViews() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
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
    const date = row.dimensionValues[0].value
    const count = parseInt(row.metricValues[0].value)
    data[date] = count
  })

  return data
}

export async function getRoutePageViews(paths = []) {
  const validPaths = Array.isArray(paths)
    ? paths.filter((p) => typeof p === 'string' && p.trim() !== '')
    : []

  if (!validPaths.length) {
    console.warn('No valid paths provided')
    return {}
  }

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      orGroup: {
        // <-- Cambio clave aquí: quita el objeto 'filter' que lo envolvía
        expressions: validPaths.map((path) => ({
          filter: {
            // <-- Cada expresión ahora debe tener su propio objeto 'filter'
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'EXACT',
              value: path,
            },
          },
        })),
      },
    },
  })

  const data = {}
  response.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    const count = parseInt(row.metricValues[0].value)
    data[path] = count
  })

  return data
}

export async function getPersonPageViews() {
  const personPaths = Array.from({ length: 9 }, (_, i) => `/person/${i + 1}`)
  console.log('Person Paths:', personPaths)
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      orGroup: {
        expressions: personPaths.map((path) => ({
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'EXACT',
              value: path,
            },
          },
        })),
      },
    },
  })

  const data = {}
  response.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    const count = parseInt(row.metricValues[0].value)
    data[path] = count
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
