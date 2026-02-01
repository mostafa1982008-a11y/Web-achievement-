import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Sparkles, Lock, CheckCircle } from 'lucide-react';
import { FinancialMetric, User, UserRole, InventoryItem, CompanySettings, Invoice, Expense } from '../types';
import { generateFinancialInsight } from '../services/geminiService';

export const Dashboard: React.FC<{user: User | null}> = ({user}) => {
  const [insight, setInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  
  // Real Data State
  const [metrics, setMetrics] = useState<FinancialMetric[]>([
      { label: 'إجمالي المبيعات', value: 0, trend: 0, isPositive: true },
      { label: 'إجمالي المصروفات', value: 0, trend: 0, isPositive: true },
      { label: 'صافي الربح', value: 0, trend: 0, isPositive: true },
      { label: 'العملاء الجدد', value: 0, trend: 0, isPositive: true },
  ]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    // 1. Load Data from V3 Storage
    const savedInventory = localStorage.getItem('inventory_data_v3');
    const savedSettings = localStorage.getItem('company_settings_v3');
    const savedInvoices = localStorage.getItem('invoices_data_v3');
    const savedExpenses = localStorage.getItem('expenses_data_v3');

    const invoices: Invoice[] = savedInvoices ? JSON.parse(savedInvoices) : [];
    const expenses: Expense[] = savedExpenses ? JSON.parse(savedExpenses) : [];
    const inventory: InventoryItem[] = savedInventory ? JSON.parse(savedInventory) : [];

    // 2. Calculate Metrics
    const totalSales = invoices.reduce((acc, inv) => acc + inv.amount, 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netProfit = totalSales - totalExpenses;
    const uniqueCustomers = new Set(invoices.map(i => i.customerName)).size;

    setMetrics([
        { label: 'إجمالي المبيعات', value: totalSales, trend: 0, isPositive: true },
        { label: 'إجمالي المصروفات', value: totalExpenses, trend: 0, isPositive: totalExpenses === 0 }, 
        { label: 'صافي الربح', value: netProfit, trend: 0, isPositive: netProfit >= 0 },
        { label: 'العملاء', value: uniqueCustomers, trend: 0, isPositive: true },
    ]);

    // 3. Prepare Chart Data (Group by Month)
    const monthlyData = Array(12).fill(0).map((_, i) => ({ 
        name: new Date(0, i).toLocaleString('ar', { month: 'long' }), 
        income: 0, 
        expense: 0 
    }));

    invoices.forEach(inv => {
        const d = new Date(inv.date);
        if(!isNaN(d.getTime())) monthlyData[d.getMonth()].income += inv.amount;
    });
    expenses.forEach(exp => {
        const d = new Date(exp.date);
        if(!isNaN(d.getTime())) monthlyData[d.getMonth()].expense += exp.amount;
    });

    setChartData(monthlyData);
    setOverdueCount(invoices.filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE').length);

    // 4. Check Low Stock
    let thresholdFn = (item: InventoryItem) => item.quantity <= item.reorderLevel; 
    if (savedSettings) {
         const settings: CompanySettings = JSON.parse(savedSettings);
         if (settings.stockAlert) {
            if (settings.stockAlert.mode === 'GLOBAL_MIN') {
               thresholdFn = (item) => item.quantity <= settings.stockAlert.value;
            } else if (settings.stockAlert.mode === 'PERCENTAGE') {
               thresholdFn = (item) => item.quantity <= item.reorderLevel * (settings.stockAlert.value / 100);
            }
         }
    }
    setLowStockItems(inventory.filter(thresholdFn));

  }, []);

  const fetchInsight = async () => {
    setLoadingInsight(true);
    const sales = metrics[0].value;
    const exp = metrics[1].value;
    const context = `Sales: ${sales} EGP, Expenses: ${exp} EGP. Net Profit: ${sales - exp}. Data is starting from zero.`;
    const result = await generateFinancialInsight(context);
    setInsight(result);
    setLoadingInsight(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">نظرة عامة على الأداء</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">مرحباً بك، {user?.name}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium">
            العملة الحالية: جنيه مصري (ج.م)
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {metric.value.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                </h3>
              </div>
              <div className={`p-2 rounded-lg ${metric.isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <DollarSign size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-sm font-medium ${metric.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                 {metric.value === 0 ? '---' : (metric.isPositive ? 'نشط' : 'انخفاض')}
              </span>
              <span className="text-xs text-gray-400">بيانات فعلية</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">التدفقات النقدية (شهرياً)</h3>
          
          {user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER ? (
             <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" name="دخل" />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={0} fill="transparent" name="مصروف" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-700">
              <Lock className="text-gray-400 mb-2" size={32} />
              <p className="text-gray-500">هذا الرسم البياني متاح للمدير والمالك فقط</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* AI Advisor Card (Admin Only) */}
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER) && (
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="text-yellow-300" />
                  <h3 className="text-lg font-bold">مستشار إنجاز الذكي</h3>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg text-sm leading-relaxed min-h-[120px]">
                  {loadingInsight ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="animate-pulse">جاري التحليل...</span>
                    </div>
                  ) : insight ? (
                    <p>{insight}</p>
                  ) : (
                    <p className="text-indigo-100">سجل بعض البيانات ثم اضغط للتحليل.</p>
                  )}
                </div>
                <button 
                  onClick={fetchInsight}
                  disabled={loadingInsight || metrics[0].value === 0}
                  className="mt-4 w-full py-2 bg-white text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  {loadingInsight ? 'جاري المعالجة...' : 'تحليل البيانات'}
                </button>
              </div>
              {/* Decor */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            </div>
          )}

          {/* Quick Actions / Alerts */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">تنبيهات النظام</h3>
            <div className="space-y-4">
              {lowStockItems.length > 0 ? (
                lowStockItems.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">مخزون منخفض</h4>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        الصنف: {item.name} (المتبقي: {item.quantity})
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg text-sm">
                   <CheckCircle size={16} /> لا توجد تنبيهات مخزون
                </div>
              )}
              
              {overdueCount > 0 ? (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertCircle size={18} className="text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">فواتير متأخرة/معلقة</h4>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-1">يوجد {overdueCount} فواتير غير مدفوعة</p>
                    </div>
                </div>
              ) : (
                 <div className="flex items-center gap-2 text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg text-sm">
                   <CheckCircle size={16} /> جميع الفواتير مدفوعة
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};