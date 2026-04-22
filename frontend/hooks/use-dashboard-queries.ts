import { useQuery } from '@tanstack/react-query';
import { getCompanies } from '@/lib/api/companies';
import { getProducts } from '@/lib/api/products';
import {
  getCompanyWiseSalesSummary,
  getDueOverview,
  getMonthlySalesSummary,
  getSales,
  getTodayProfitSummary,
  getTodaySalesSummary,
} from '@/lib/api/sales';
import { getStockInvestmentSummary, getStockMovements } from '@/lib/api/stock';

export function useDashboardData(showProfit: boolean) {
  const companies = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  });

  const todaySales = useQuery({
    queryKey: ['sales', 'summary', 'today'],
    queryFn: () => getTodaySalesSummary(),
  });

  const todayProfit = useQuery({
    queryKey: ['sales', 'summary', 'profit'],
    queryFn: () => getTodayProfitSummary(),
    enabled: showProfit,
  });

  const dueOverview = useQuery({
    queryKey: ['sales', 'summary', 'due'],
    queryFn: () => getDueOverview(),
  });

  const monthlySales = useQuery({
    queryKey: ['sales', 'summary', 'monthly'],
    queryFn: () => getMonthlySalesSummary(),
  });

  const companyWiseSales = useQuery({
    queryKey: ['sales', 'summary', 'company'],
    queryFn: () => getCompanyWiseSalesSummary(),
  });

  const stockInvestment = useQuery({
    queryKey: ['stock', 'summary', 'investment'],
    queryFn: () => getStockInvestmentSummary(),
  });

  const recentSales = useQuery({
    queryKey: ['sales', 'list', { page: 1, limit: 10 }],
    queryFn: () => getSales({ page: 1, limit: 10 }),
  });

  const damageMovements = useQuery({
    queryKey: ['stock', 'movements', { type: 'DAMAGE' }],
    queryFn: () => getStockMovements(undefined, { type: 'DAMAGE' }),
  });

  return {
    companies,
    todaySales,
    todayProfit,
    dueOverview,
    monthlySales,
    companyWiseSales,
    stockInvestment,
    recentSales,
    damageMovements,
  };
}
