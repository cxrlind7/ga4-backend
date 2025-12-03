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

// ============================================
// 1. Obtener Vistas de Blogs Individuales
// ============================================
export async function getBlogPageViews(startDate = '30daysAgo', endDate = 'today') {
  try {
    // 1️⃣ Consulta Principal: Métricas clave para el rango seleccionado
    const [pageViewsResponse] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' }, // [0] Vistas
        { name: 'activeUsers' }, // [1] Usuarios
        { name: 'screenPageViewsPerUser' }, // [2] Vistas/Usuario
        { name: 'userEngagementDuration' }, // [3] Tiempo total (segundos)
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

    // 2️⃣ Consulta Secundaria: Eventos 'share_blog' para el MISMO rango
    const [shareEventsResponse] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
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
    // Esta SIEMPRE debe ser los últimos 7 días para que la gráfica pequeña se vea consistente
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
      if (path.startsWith('/blog/') && path.split('/').length > 2) {
        const values = row.metricValues.map((v) => parseFloat(v.value))
        viewsByPath[path] = {
          visits: values[0],
          users: values[1],
          viewsPerUser: values[2].toFixed(1),
          avgEngagementTime: values[1] > 0 ? Math.round(values[3] / values[1]) : 0,
          totalEvents: values[4],
          engagementRate: (values[5] * 100).toFixed(0),
          shares: 0,
          daily: {},
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

    // Procesar daily
    dailyResponse.rows?.forEach((row) => {
      const path = row.dimensionValues[0].value
      const date = row.dimensionValues[1].value
      if (viewsByPath[path]) {
        viewsByPath[path].daily[date] = parseInt(row.metricValues[0].value)
      }
    })

    return viewsByPath
  } catch (error) {
    console.error('Error en getBlogPageViews:', error)
    throw error
  }
}

// ============================================
// 2. Obtener Vistas de la Homepage (Tendencia)
// ============================================
export async function getHomepageViewsDaily(startDate = '30daysAgo', endDate = 'today') {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'EXACT', value: '/' },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    })

    const dailyViews = {}
    response.rows?.forEach((row) => {
      const date = row.dimensionValues[0].value
      const views = parseInt(row.metricValues[0].value, 10)
      dailyViews[date] = views
    })

    return dailyViews
  } catch (error) {
    console.error('Error en getHomepageViewsDaily:', error)
    throw error
  }
}

// ============================================
// 3. Obtener Vistas de Rutas Principales (Secciones)
// ============================================
export async function getRoutesViews(startDate = '30daysAgo', endDate = 'today') {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
    })

    const routeViews = {}
    response.rows?.forEach((row) => {
      const path = row.dimensionValues[0].value
      const views = parseInt(row.metricValues[0].value, 10)
      // Filtramos para que no sean blogs ni perfiles, solo secciones principales
      // Ajusta según tus rutas reales. El usuario pidió esto.
      if (!path.startsWith('/blog/') && !path.startsWith('/person/') && path !== '/' && views > 0) {
        routeViews[path] = views
      }
    })

    return routeViews
  } catch (error) {
    console.error('Error en getRoutesViews:', error)
    throw error
  }
}

// ============================================
// 4. Obtener Vistas de Perfiles de Especialistas
// ============================================
export async function getPersonViews(startDate = '30daysAgo', endDate = 'today', personId = null) {
  try {
    let filterConfig = {
      fieldName: 'pagePath',
      stringFilter: {
        matchType: 'CONTAINS',
        value: '/person/',
      },
    }

    if (personId) {
      filterConfig = {
        fieldName: 'pagePath',
        stringFilter: {
          matchType: 'ENDS_WITH',
          value: `/person/${personId}`,
        },
      }
    }

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: filterConfig,
      },
    })

    const personViews = []
    response.rows?.forEach((row) => {
      const path = row.dimensionValues[0].value
      const views = parseInt(row.metricValues[0].value, 10)
      if (path.includes('/person/') && views > 0) {
        personViews.push({ path, views })
      }
    })

    return personViews
  } catch (error) {
    console.error('Error en getPersonViews:', error)
    throw error
  }
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
