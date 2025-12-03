// server/getAnalyticsData.js
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Inicializa el cliente. Asegúrate de que GOOGLE_APPLICATION_CREDENTIALS_JSON esté en tus variables de entorno.
const analyticsDataClient = new BetaAnalyticsDataClient();
const propertyId = '449638289'; // Tu GA4 Property ID

// ============================================
// 1. Obtener Vistas de Blogs Individuales
// ============================================
export async function getBlogPageViews(startDate = '30daysAgo', endDate = 'today') {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: startDate,
          endDate: endDate,
        },
      ],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'engagementRate' },
        { name: 'averageSessionDuration' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'BEGINS_WITH',
            value: '/blog/',
          },
        },
      },
    });

    const blogStats = {};
    response.rows.forEach((row) => {
      const path = row.dimensionValues[0].value;
      const visits = parseInt(row.metricValues[0].value, 10) || 0;
      // engagementRate viene como 0.XXXX, lo multiplicamos por 100 para porcentaje
      const engagementRate = parseFloat(row.metricValues[1].value || 0) * 100;
      const avgDuration = parseFloat(row.metricValues[2].value || 0);

      if (path !== '/blog/' && visits > 0) {
        blogStats[path] = {
          visits: visits,
          engagementRate: engagementRate.toFixed(1), // Un decimal
          avgEngagementTime: Math.round(avgDuration), // Segundos enteros
          shares: Math.round(visits * (Math.random() * 0.05)), // Dato simulado
        };
      }
    });

    return blogStats;
  } catch (error) {
    console.error('Error en getBlogPageViews:', error);
    throw error; // Lanzar el error para que server.js lo maneje
  }
}

// ============================================
// 2. Obtener Vistas de la Homepage (Tendencia Diaria)
// ============================================
export async function getHomepageViewsDaily(startDate = '30daysAgo', endDate = 'today') {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: startDate,
          endDate: endDate,
        },
      ],
      dimensions: [{ name: 'date' }], // Agrupamos por día (YYYYMMDD)
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'EXACT',
            value: '/', // Solo la raíz exacta
          },
        },
      },
      orderBys: [
        {
          dimension: { dimensionName: 'date' },
        },
      ],
    });

    const dailyViews = {};
    response.rows.forEach((row) => {
      const date = row.dimensionValues[0].value;
      const views = parseInt(row.metricValues[0].value, 10);
      dailyViews[date] = views;
    });

    return dailyViews;
  } catch (error) {
    console.error('Error en getHomepageViewsDaily:', error);
    throw error;
  }
}

// ============================================
// 3. Obtener Vistas de Rutas Principales (Secciones)
// ============================================
export async function getRoutesViews(startDate = '30daysAgo', endDate = 'today') {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: startDate,
          endDate: endDate,
        },
      ],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
    });

    const routeViews = {};
    response.rows.forEach((row) => {
      const path = row.dimensionValues[0].value;
      const views = parseInt(row.metricValues[0].value, 10);
      // Filtramos para que no sean blogs ni perfiles, solo secciones principales
      if (!path.startsWith('/blog/') && !path.startsWith('/person/')) {
        routeViews[path] = views;
      }
    });

    return routeViews;
  } catch (error) {
    console.error('Error en getRoutesViews:', error);
    throw error;
  }
}

// ============================================
// 4. Obtener Vistas de Perfiles de Especialistas (CORREGIDO Y SEGURO)
// ============================================
export async function getPersonViews(
  startDate = '30daysAgo',
  endDate = 'today',
  personId = null
) {
  try {
    // ESTRATEGIA SEGURA: Siempre pedimos a GA todo lo que contenga "/person/"
    // No intentamos construir filtros complejos dinámicamente en la llamada a GA.
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: startDate,
          endDate: endDate,
        },
      ],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'CONTAINS',
            value: '/person/',
          },
        },
      },
    });

    // Procesamos los resultados crudos
    let personViews = [];
    response.rows.forEach((row) => {
      const path = row.dimensionValues[0].value;
      const views = parseInt(row.metricValues[0].value, 10);
      if (path.includes('/person/') && views > 0) {
        personViews.push({ path, views });
      }
    });

    // FILTRADO EN JAVASCRIPT: Si se proporcionó un personId, filtramos aquí.
    // Esto es mucho más seguro que intentar filtrar en la consulta de GA.
    if (personId) {
      const targetPathEnding = `/person/${personId}`;
      // Filtramos el array para dejar solo los paths que terminan con ese ID
      personViews = personViews.filter((item) => item.path.endsWith(targetPathEnding));
    }

    return personViews;
  } catch (error) {
    console.error('Error en getPersonViews:', error);
    throw error;
  }
}
