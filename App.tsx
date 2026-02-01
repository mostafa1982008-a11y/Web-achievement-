import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { 
  SalesModule, 
  PurchasesModule, 
  InventoryModule, 
  ExpensesModule, 
  FinanceModule, 
  PayrollModule, 
  ReportsModule, 
  SettingsModule 
} from './components/Modules';
import { AppRoute, User, UserRole } from './types';
import { ShieldCheck, User as UserIcon, Lock, AlertCircle } from 'lucide-react';

// Login Component
const LoginScreen: React.FC<{ onLogin: (u: User) => void, users: User[] }> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validate credentials
    setTimeout(() => {
      setLoading(false);
      // Check created users
      const foundUser = users.find(u => u.username === username && u.password === password);
      
      if (foundUser) {
         onLogin(foundUser);
      } else {
        setError('خطأ في اسم المستخدم أو كلمة المرور');
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-cairo" dir="rtl">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        {/* Illustration Side */}
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 to-indigo-800 w-1/2 p-12 text-white relative overflow-hidden">
           <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 mix-blend-multiply opacity-50 blur-3xl"></div>
           <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500 rounded-full translate-x-1/2 translate-y-1/2 mix-blend-multiply opacity-50 blur-3xl"></div>
           
           <div className="z-10 text-center">
             <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">E</div>
             <h1 className="text-4xl font-bold mb-4">نظام إنجاز</h1>
             <p className="text-lg text-blue-100">الحل المتكامل لإدارة حسابات الشركات الصغيرة والمتوسطة بدقة واحترافية.</p>
           </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <div className="text-center md:text-right mb-10">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">تسجيل الدخول</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">يرجى إدخال اسم المستخدم وكلمة المرور</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اسم المستخدم (Username)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pl-10"
                  placeholder="admin"
                  required
                />
                <UserIcon size={18} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">كلمة المرور</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pl-10"
                  placeholder="••••••••"
                  required
                />
                <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-transform active:scale-95 flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  <span>دخول آمن</span>
                </>
              )}
            </button>
            
            <p className="text-center text-sm text-gray-400 mt-4">
               تواصل مع الإدارة للحصول على بيانات الدخول
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRoute, setActiveRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  
  // Persistence for Users (V3 Fresh Start)
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('app_users_v3');
    return savedUsers ? JSON.parse(savedUsers) : [
      { 
        id: 'super-admin-01', 
        username: 'admin', 
        password: 'admin', 
        name: 'المدير العام (Admin)', 
        role: UserRole.OWNER 
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('app_users_v3', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleCreateUser = (newUser: User) => {
      setUsers(prev => [...prev, newUser]);
      alert(`تم إنشاء المستخدم بنجاح!\nUsername: ${newUser.username}`);
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser, password: updatedUser.password || u.password } : u));
  };

  const handleDeleteUser = (userId: string) => {
      // Prevent deleting the main admin
      if (userId === 'super-admin-01') {
        alert("لا يمكن حذف حساب المدير الرئيسي");
        return;
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const renderContent = () => {
    switch (activeRoute) {
      case AppRoute.DASHBOARD:
        return <Dashboard user={currentUser} />;
      case AppRoute.SALES:
        return <SalesModule user={currentUser} />;
      case AppRoute.PURCHASES:
        return <PurchasesModule user={currentUser} />;
      case AppRoute.INVENTORY:
        return <InventoryModule user={currentUser} />;
      case AppRoute.EXPENSES:
        return <ExpensesModule user={currentUser} />;
      case AppRoute.FINANCE:
        return <FinanceModule user={currentUser} />;
      case AppRoute.PAYROLL:
        return <PayrollModule 
            onCreateUser={handleCreateUser} 
            onUpdateUser={handleUpdateUser} 
            onDeleteUser={handleDeleteUser}
            user={currentUser} 
        />;
      case AppRoute.REPORTS:
        return <ReportsModule user={currentUser} />;
      case AppRoute.SETTINGS:
        return <SettingsModule 
          toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} 
          toggleLanguage={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')}
          theme={theme}
          language={language}
          user={currentUser}
        />;
      default:
        return <div>Not Found</div>;
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} users={users} />;
  }

  return (
    <Layout
      activeRoute={activeRoute}
      onNavigate={setActiveRoute}
      onLogout={handleLogout}
      user={currentUser}
      theme={theme}
      toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
      language={language}
      toggleLanguage={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;