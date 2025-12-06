import { BetaAnalyticsDataClient } from '@google-analytics/data'
//commentt
const credentials = {
  type: 'service_account',
  project_id: 'crianzasana-c33aa',
  private_key_id: '694d0980b4395231fbb3bc5de05cacfcb2b0447f',
  private_key:
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCN1shQ/o83JoRp\nvOaN05t6nhuFm1nWMWB5l4W23h9klULMGsICRuqNqUmP0oFQke5GKLwJdM9vZgcA\ndOsovMrw1H6N0evOoWfAd7kJgjoGgCGQwdE9yOJ8Az8zdXmjQ2y2yyuU07ZPx0VT\nIRNl8fdi1kqctjycbosOVOSaR8JET+HF91IWsD/fuRUW7Wm3simQk0YW9ZUP3u30\nQgFZRmsv6UyXKzhNYN8hXVZL8wAqOUrxKYIM91hzvDS4JlcoSHhhQAWUPdbYsjxh\nurVThB1ryEcrosi9rx3jpI+VWTt1G2gd5nD9NrO1sYyUM4y3/pW/jWGp5zSyFTc0\noWXvAPNhAgMBAAECggEAMub7UbHhdMHicE4GEaz41drq9ppndaqXvFtH9fYmHwNA\nCx6pNIb9wyQXTcGWffM5Jz2UKfKdRRXA+oV7JU4HqMEhv8Sv0yJyqQxuP/7X0yBl\nq10bOgifWzERG+cTZaebWsh0Ff+apGvXsbsjioj5JqPP+AignOVBCz4lIkcRbVES\n3thM6YRdYe+IrQRxhpdYQw5RE/7QUVRyUDbixNUCtgddyrC/oTDspUnqaW+UmW3x\nm1LPbuZ2LifHCkzq2zghaQP8QklWrKywRXh3ryiw8DbyArVYA9AD9U6sWSM5qqcq\n5+RqFjU0sHSeFA9KZ0E65JFxGiOJ9DUwGFl8XXcSfwKBgQDDDV6Q9PKPQnJu/Ryn\nCt/Z4YvSoihtA2U9Scf7K+CCYQPqKjuy+xJSN+Ug2H2pTiTvAhh2ebDDLnp72qkt\ndlHnfEIDknpxptmKPQvjEv1hAnnuXkYJ2vTYDFXuo2Fc+07/zmQ3wuORpVB80nRD\nAHhjlU31v9U6jPPi1sDs9klo5wKBgQC6KMbdOhY3H29LzUCDE3m3wJcsz9jAJJZX\nm0NmZ9Q1N7ElVzLcOCD6fBsktk5d3SKGZxCJSjr8FGFE2z9Fe2YcHLjxMVPtOujM\n2jJzzLibq+pf/WL8S3bXAVeMAsBgSWK5EtQ+m+KySHE68IJCLGKV3roSmDSqUJc+\nkeYaXP9QdwKBgAOlV1QsT/BflJYAgy2YJXEEJ0HrqAfJnXXU0Dkgq9SkDZet7Gm/\nCauhwdWoVkj43fXduylTwvsS/lUcVDc2U/eYuf8pGMLRFJXh6Dv5WeUbT74l4vdC\nMXtsV5rbUPGU/PgJGpR0Px600VlT8bpi4t0xqEBkso6indhqnTaQr/SXAoGAErae\npwZ7zTa/vWL4pTSD+9DEYaDTLR2Ab3YQJG8zidX7XMGTP0f1KLjpEZux7QWZvuEF\nbIelvkleLcnMZnOtJA5PGQ/YW/ScClu0zqc5t4xklxmlpa8AV0SvREfShttZrTkT\nVOfetgVKPJ6IuZY0otQs6EmcobJQQd3wv52xnKkCgYEAr6cuiA6LZW7xwUC2dDta\n+FZWGDbReS0cFpkynXefuncgAMKGC9bnqt666YvH9kdILNa7q/0hkCUXxxkgfD3+\n72gQK/f2Sz8VrnG3393Xj/FnW/r0VudTEUhaA/B7KqP13j3i19GoK0pVU8OhC914\nz2oMUXkHH2FIoSj/S9JW09E=\n-----END PRIVATE KEY-----\n',
  client_email: 'analytics-reader-322@crianzasana-c33aa.iam.gserviceaccount.com',
  client_id: '110837336930057584628',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/analytics-reader-322%40crianzasana-c33aa.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com',
}

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials,
})

const PROPERTY_ID = '483239794'

export async function getBlogPageViews(startDate = '30daysAgo', endDate = 'today') {
  // 1️⃣ Consulta: visitas totales y tiempo de lectura promedio
  const [pageViewsResponse] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' }, // ✅ Vistas
      { name: 'activeUsers' }, // ✅ Usuarios activos
      { name: 'screenPageViewsPerUser' }, // ✅ Vistas por usuario
      { name: 'userEngagementDuration' }, // ✅ Tiempo total de interacción
      { name: 'eventCount' }, // ✅ Número de eventos
      { name: 'engagementRate' }, // ✅ Tasa de interacción
      { name: 'averageSessionDuration' }, // ✅ Duración promedio de sesión
    ],
  })

  // 2️⃣ Consulta: solo eventos 'share_blog'
  const [shareEventsResponse] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
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
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }, { name: 'date' }],
    metrics: [{ name: 'screenPageViews' }],
  })

  const viewsByPath = {}

  pageViewsResponse.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    const values = row.metricValues.map((v) => parseFloat(v.value))

    if (path.startsWith('/blog/')) {
      // DEBUG: Ver valores crudos para validar unidades
      // console.log(`Path: ${path}, Views: ${values[0]}, Users: ${values[1]}, Duration: ${values[3]}`)

      viewsByPath[path] = {
        visits: values[0],
        users: values[1],
        viewsPerUser: values[2].toFixed(2),
        avgEngagementPerUser: values[1] > 0 ? Math.round(values[3] / values[1]) : 0,
        avgEngagementPerVisit: values[0] > 0 ? Math.round(values[3] / values[0]) : 0,
        readTime: values[0] > 0 ? Math.round(values[3] / values[0]) : 0, // segundos (userEngagementDuration es en segundos)
        totalEvents: values[4],
        engagementRate: (parseFloat(values[5]) * 100).toFixed(2), // GA4 devuelve decimal (0.55), convertimos a %
        avgSessionDuration: parseFloat(values[6]).toFixed(0),
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
      // const v = viewsByPath[path].visits
      // viewsByPath[path].interactionRate = v > 0 ? Math.round((shares / v) * 100) : 0
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

export async function getHomepageDailyViews(startDate = '30daysAgo', endDate = 'today') {
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
  })

  const data = {}
  response.rows?.forEach((row) => {
    const date = row.dimensionValues[0].value
    const count = parseInt(row.metricValues[0].value)
    data[date] = count
  })

  return data
}

export async function getRoutePageViews(paths = [], startDate = '30daysAgo', endDate = 'today') {
  const validPaths = Array.isArray(paths)
    ? paths.filter((p) => typeof p === 'string' && p.trim() !== '')
    : []

  if (!validPaths.length) {
    console.warn('No valid paths provided')
    return {}
  }

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
      { name: 'userEngagementDuration' },
      { name: 'engagementRate' },
      { name: 'averageSessionDuration' }, // ✅ Added
    ],
    dimensionFilter: {
      orGroup: {
        expressions: validPaths.map((path) => ({
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
    const views = parseInt(row.metricValues[0].value)
    const users = parseInt(row.metricValues[1].value)
    const duration = parseFloat(row.metricValues[2].value)
    const engagementRate = parseFloat(row.metricValues[3].value)
    const avgSessionDuration = parseFloat(row.metricValues[4].value)

    data[path] = {
      views,
      users,
      avgEngagementPerUser: users > 0 ? Math.round(duration / users) : 0,
      engagementRate: (engagementRate * 100).toFixed(0),
      avgSessionDuration: avgSessionDuration.toFixed(0), // ✅ Added
    }
  })

  return data
}

export async function getPersonPageViews(startDate = '30daysAgo', endDate = 'today') {
  // Usamos BEGINS_WITH para capturar todos los perfiles (/person/1, /person/111, etc.)
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
      { name: 'userEngagementDuration' },
      { name: 'engagementRate' },
      { name: 'averageSessionDuration' }, // ✅ Added
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: {
          matchType: 'BEGINS_WITH',
          value: '/person/',
        },
      },
    },
  })

  const data = {}
  response.rows?.forEach((row) => {
    const path = row.dimensionValues[0].value
    const views = parseInt(row.metricValues[0].value)
    const users = parseInt(row.metricValues[1].value)
    const duration = parseFloat(row.metricValues[2].value)
    const engagementRate = parseFloat(row.metricValues[3].value)
    const avgSessionDuration = parseFloat(row.metricValues[4].value)

    data[path] = {
      views,
      users,
      avgEngagementPerUser: users > 0 ? Math.round(duration / users) : 0,
      engagementRate: (engagementRate * 100).toFixed(0),
      avgSessionDuration: avgSessionDuration.toFixed(0), // ✅ Added
    }
  })

  return data
}

export async function getBlogEventBreakdown(startDate = '30daysAgo', endDate = 'today') {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
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
