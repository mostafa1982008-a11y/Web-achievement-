import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ShoppingBag, 
  Package, 
  Wallet, 
  Users, 
  PieChart, 
  Settings, 
  LogOut, 
  Menu, 
  Moon, 
  Sun,
  Globe,
  Bell,
  Search
} from 'lucide-react';
import { AppRoute, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
  user: User | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: 'ar' | 'en';
  toggleLanguage: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeRoute, 
  onNavigate, 
  onLogout,
  user,
  theme,
  toggleTheme,
  language,
  toggleLanguage
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const menuItems = [
    { id: AppRoute.DASHBOARD, label: language === 'ar' ? 'لوحة القيادة' : 'Dashboard', icon: LayoutDashboard },
    { id: AppRoute.SALES, label: language === 'ar' ? 'المبيعات' : 'Sales', icon: ShoppingCart },
    { id: AppRoute.PURCHASES, label: language === 'ar' ? 'المشتريات' : 'Purchases', icon: ShoppingBag },
    { id: AppRoute.INVENTORY, label: language === 'ar' ? 'المخزون' : 'Inventory', icon: Package },
    { id: AppRoute.FINANCE, label: language === 'ar' ? 'المالية والحسابات' : 'Finance', icon: PieChart },
    { id: AppRoute.EXPENSES, label: language === 'ar' ? 'المصروفات' : 'Expenses', icon: Wallet },
    { id: AppRoute.PAYROLL, label: language === 'ar' ? 'شؤون الموظفين' : 'HR & Payroll', icon: Users },
    { id: AppRoute.REPORTS, label: language === 'ar' ? 'التقارير' : 'Reports', icon: PieChart }, // Reusing PieChart for simplicity
    { id: AppRoute.SETTINGS, label: language === 'ar' ? 'الإعدادات' : 'Settings', icon: Settings },
  ];

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-slate-900 ${language === 'ar' ? 'font-cairo' : 'font-sans'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} 
        bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl z-20`}
      >
        <div className="h-16 flex items-center justify-between px-4 bg-slate-950">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold text-lg">E</div>
              <span className="font-bold text-xl tracking-wide">إنجاز</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold text-lg mx-auto">E</div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200
                    ${activeRoute === item.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                >
                  <item.icon size={20} />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center gap-3 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
              {user?.name.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.role}</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={onLogout} className="text-slate-400 hover:text-red-400 transition-colors">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-full w-64">
              <Search size={16} className="text-gray-400" />
              <input 
                type="text" 
                placeholder={language === 'ar' ? "بحث في النظام..." : "Search..."}
                className="bg-transparent border-none outline-none text-sm w-full dark:text-gray-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={toggleLanguage}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 flex items-center gap-2"
              title="Change Language"
            >
              <Globe size={20} />
              <span className="text-xs font-bold">{language.toUpperCase()}</span>
            </button>

            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
};