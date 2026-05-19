import api from '../api/axios';

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
