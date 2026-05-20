import api from '../api/axios';

export const getAnomalies = async (year, month) => {
  try {
    const res = await api.get(`/analytics/anomalies?year=${year}&month=${month}`);
    return res.data;
  } catch (error) {
    console.error('Anomalies fetch failed:', error);
    return { year, month, anomalies: [] };
  }
};

export const getExpenseTrends = async (year) => {
  try {
    const res = await api.get(`/analytics/trends?year=${year}`);
    return res.data;
  } catch (error) {
    console.error('Analytics fetch failed:', error);
    // Return hardcoded mock data if API fails
    return getMockTrendData();
  }
};

export const getAnalytics = async () => {
  try {
    const res = await api.get('/analytics');
    return res.data;
  } catch (error) {
    console.error('Analytics BI fetch failed:', error);
    return {
      historicalTrends: getMockTrendData(),
      forecast: 14500.00,
      supplierProfiles: [
        { SupplierName: 'Acme Corp', TotalSupplied: 12, RejectionRate: 8.3, AvgLeadTimeDays: 4 },
        { SupplierName: 'Global Industries', TotalSupplied: 8, RejectionRate: 0.0, AvgLeadTimeDays: 2 }
      ],
      efficiencyKPIs: { RejectionRate: 4.5, AvgApprovalDays: 3 }
    };
  }
};

// Hardcoded fallback data
const getMockTrendData = () => [
  { MonthName: 'January',  CategoryName: 'Stock Purchase', TotalSpent: 2100 },
  { MonthName: 'January',  CategoryName: 'Utilities',      TotalSpent: 480  },
  { MonthName: 'January',  CategoryName: 'Salaries',       TotalSpent: 5000 },
  { MonthName: 'January',  CategoryName: 'Rent',           TotalSpent: 1000 },
  { MonthName: 'January',  CategoryName: 'Transport',      TotalSpent: 220  },
  { MonthName: 'February', CategoryName: 'Stock Purchase', TotalSpent: 1850 },
  { MonthName: 'February', CategoryName: 'Utilities',      TotalSpent: 500  },
  { MonthName: 'February', CategoryName: 'Salaries',       TotalSpent: 5000 },
  { MonthName: 'February', CategoryName: 'Rent',           TotalSpent: 1000 },
  { MonthName: 'February', CategoryName: 'Transport',      TotalSpent: 190  },
  { MonthName: 'March',    CategoryName: 'Stock Purchase', TotalSpent: 2300 },
  { MonthName: 'March',    CategoryName: 'Utilities',      TotalSpent: 520  },
  { MonthName: 'March',    CategoryName: 'Salaries',       TotalSpent: 5000 },
  { MonthName: 'March',    CategoryName: 'Rent',           TotalSpent: 1000 },
  { MonthName: 'March',    CategoryName: 'Transport',      TotalSpent: 250  },
];

