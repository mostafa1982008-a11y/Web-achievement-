import React, { useState, useEffect } from 'react';
import { Invoice, InventoryItem, Employee, Expense, Supplier, Deduction, UserRole, User, CompanySettings, RolePermission, PaymentTransaction, StockAlertConfig } from '../types';
import { Search, Filter, Download, Plus, Trash2, Edit2, AlertTriangle, CheckCircle, Building2, User as UserIcon, Save, FileText, X, UserPlus, Gavel, FileSpreadsheet, Printer, Moon, Sun, Globe, Bot, CreditCard, Banknote, Shield, History, ArrowDownLeft, ArrowUpRight, TrendingUp, DollarSign, RefreshCw, ToggleLeft, ToggleRight, Wallet, UserMinus, Package, Monitor, Sliders } from 'lucide-react';

// --- Helper Functions ---
const usePersistentState = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};

const getStockStatus = (item: InventoryItem, config: StockAlertConfig) => {
  let threshold = item.reorderLevel;

  if (config.mode === 'GLOBAL_MIN') {
    threshold = config.value;
  } else if (config.mode === 'PERCENTAGE') {
    // Notify if quantity is below X% of reorder level
    threshold = item.reorderLevel * (config.value / 100);
  }

  return item.quantity <= threshold;
};

const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(',')).join('\n');
  const csvContent = "data:text/csv;charset=utf-8," + `\uFEFF${headers}\n${rows}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const printInvoice = (inv: Invoice) => {
  const printWindow = window.open('', '', 'height=600,width=800');
  if (printWindow) {
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة رقم ${inv.number}</title>
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
            .total { text-align: left; font-size: 1.2em; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>إنجاز للحلول المتكاملة</h1>
            <p>فاتورة مبيعات</p>
          </div>
          <div class="details">
            <p><strong>رقم الفاتورة:</strong> ${inv.number}</p>
            <p><strong>التاريخ:</strong> ${inv.date}</p>
            <p><strong>العميل:</strong> ${inv.customerName}</p>
          </div>
          <table>
            <thead>
              <tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
            </thead>
            <tbody>
              <tr><td>منتجات متنوعة</td><td>${inv.items}</td><td>-</td><td>${inv.amount}</td></tr>
            </tbody>
          </table>
          <div class="total">الإجمالي: ${inv.amount.toLocaleString()} ج.م</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
};

// --- Shared Components ---
const ModuleHeader: React.FC<{ title: string; onAdd?: () => void; addLabel?: string; onExport?: () => void; onPrint?: () => void; printLabel?: string }> = ({ title, onAdd, addLabel, onExport, onPrint, printLabel }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      {onPrint && (
        <button
          onClick={onPrint}
          className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Printer size={18} />
          <span>{printLabel || 'طباعة'}</span>
        </button>
      )}
      {onExport && (
        <button 
          onClick={onExport}
          className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <FileSpreadsheet size={18} />
          <span>تصدير Excel</span>
        </button>
      )}
      {onAdd && (
        <button 
          onClick={onAdd}
          className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>{addLabel || 'جديد'}</span>
        </button>
      )}
    </div>
  </div>
);

const SearchBar: React.FC<{ placeholder: string, onChange?: (val: string) => void }> = ({ placeholder, onChange }) => (
  <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-wrap gap-4 justify-between bg-white dark:bg-slate-800 rounded-t-xl">
    <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 px-3 py-2 rounded-lg w-full md:w-96 border border-gray-200 dark:border-slate-700">
      <Search size={18} className="text-gray-400" />
      <input 
        type="text" 
        placeholder={placeholder} 
        className="bg-transparent border-none outline-none w-full text-sm dark:text-gray-200" 
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
        <h3 className="text-xl font-bold dark:text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-red-500 bg-gray-100 dark:bg-slate-700 p-1 rounded-full">
          <X size={20} />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

// --- SALES MODULE ---
export const SalesModule: React.FC<{user: User | null}> = ({user}) => {
  // Use V3 Key for fresh start
  const [invoices, setInvoices] = usePersistentState<Invoice[]>('invoices_data_v3', []);
  const [showModal, setShowModal] = useState(false);
  const [newInv, setNewInv] = useState({ customer: '', amount: 0, items: 1 });

  const handleSave = () => {
    const inv: Invoice = {
      id: Date.now().toString(),
      number: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      customerName: newInv.customer,
      date: new Date().toISOString().split('T')[0],
      amount: newInv.amount,
      status: 'PENDING',
      items: newInv.items
    };
    setInvoices([inv, ...invoices]);
    setShowModal(false);
    setNewInv({ customer: '', amount: 0, items: 1 });
  };

  const toggleInvoiceStatus = (id: string) => {
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: inv.status === 'PAID' ? 'PENDING' : 'PAID'} : inv));
  };

  return (
    <div>
      <ModuleHeader 
        title="إدارة المبيعات" 
        onAdd={() => setShowModal(true)} 
        addLabel="فاتورة جديدة" 
        onExport={() => exportToCSV(invoices, 'sales_report')} 
      />
      
      {showModal && (
        <Modal title="فاتورة مبيعات جديدة" onClose={() => setShowModal(false)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">العميل</label>
                  <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="اسم العميل" value={newInv.customer} onChange={e => setNewInv({...newInv, customer: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">التاريخ</label>
                  <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                 <h4 className="font-semibold mb-2 dark:text-gray-200">تفاصيل الفاتورة</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="المبلغ الإجمالي" className="p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewInv({...newInv, amount: Number(e.target.value)})} />
                    <input type="number" placeholder="عدد الأصناف" className="p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewInv({...newInv, items: Number(e.target.value)})} />
                 </div>
              </div>
              <div className="flex justify-end pt-4 gap-2">
                 <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">إلغاء</button>
                 <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
              </div>
            </div>
        </Modal>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <SearchBar placeholder="بحث برقم الفاتورة أو اسم العميل..." />
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">رقم الفاتورة</th>
                <th className="px-6 py-4 font-medium">العميل</th>
                <th className="px-6 py-4 font-medium">التاريخ</th>
                <th className="px-6 py-4 font-medium">المبلغ</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-sm text-gray-700 dark:text-gray-300">
              {invoices.length === 0 ? (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">لا توجد فواتير مبيعات مسجلة</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium">{inv.number}</td>
                  <td className="px-6 py-4 font-semibold">{inv.customerName}</td>
                  <td className="px-6 py-4 text-gray-500">{inv.date}</td>
                  <td className="px-6 py-4 font-bold">{inv.amount.toLocaleString()} ج.م</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                      ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {inv.status === 'PAID' ? 'مدفوعة' : 'معلقة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                     <button onClick={() => printInvoice(inv)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="طباعة PDF">
                        <Printer size={18} />
                     </button>
                     <button 
                        onClick={() => toggleInvoiceStatus(inv.id)} 
                        className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded" 
                        title={inv.status === 'PAID' ? 'تحويل إلى معلقة' : 'تحويل إلى مدفوعة'}
                     >
                        <RefreshCw size={18} />
                     </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- PURCHASES MODULE ---
export const PurchasesModule: React.FC<{user: User | null}> = ({user}) => {
  // Use V3 Key for fresh start
  const [suppliers, setSuppliers] = usePersistentState<Supplier[]>('suppliers_data_v3', []);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({});
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const handleSave = () => {
    if(!newSupplier.name) return;
    const sup: Supplier = {
      id: Date.now().toString(),
      name: newSupplier.name,
      contact: newSupplier.contact || '',
      balance: Number(newSupplier.balance || 0)
    };
    setSuppliers([...suppliers, sup]);
    setShowModal(false);
    setNewSupplier({});
  };

  const openPaymentModal = (sup: Supplier) => {
      setSelectedSupplier(sup);
      setPaymentAmount(0);
      setShowPaymentModal(true);
  };

  const handlePayment = () => {
      if (!selectedSupplier || paymentAmount <= 0) return;
      
      const updatedSuppliers = suppliers.map(s => {
          if (s.id === selectedSupplier.id) {
              return { ...s, balance: s.balance - paymentAmount };
          }
          return s;
      });

      setSuppliers(updatedSuppliers);
      setShowPaymentModal(false);
      alert(`تم تسجيل دفعة بقيمة ${paymentAmount} للمورد ${selectedSupplier.name}`);
  };

  return (
    <div>
      <ModuleHeader title="المشتريات والموردين" onAdd={() => setShowModal(true)} addLabel="إضافة مورد" onExport={() => exportToCSV(suppliers, 'suppliers')} />
      
      {showModal && (
        <Modal title="إضافة مورد جديد" onClose={() => setShowModal(false)}>
           <div className="space-y-4">
             <input type="text" placeholder="اسم المورد" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
             <input type="text" placeholder="رقم الاتصال" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})} />
             <input type="number" placeholder="الرصيد الافتتاحي (مديونية)" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewSupplier({...newSupplier, balance: Number(e.target.value)})} />
             <button onClick={handleSave} className="w-full py-2 bg-blue-600 text-white rounded-lg">حفظ</button>
           </div>
        </Modal>
      )}

      {showPaymentModal && selectedSupplier && (
          <Modal title={`سداد دفعة للمورد: ${selectedSupplier.name}`} onClose={() => setShowPaymentModal(false)}>
              <div className="space-y-4">
                  <div className="bg-red-50 p-3 rounded text-red-700 dark:bg-red-900/20 dark:text-red-300">
                      الرصيد الحالي المستحق: <strong>{selectedSupplier.balance.toLocaleString()} ج.م</strong>
                  </div>
                  <div>
                      <label className="block text-sm dark:text-gray-300 mb-1">قيمة الدفعة</label>
                      <input 
                        type="number" 
                        className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" 
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(Number(e.target.value))}
                      />
                  </div>
                  <button onClick={handlePayment} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex justify-center items-center gap-2">
                      <Banknote size={18} />
                      تأكيد السداد
                  </button>
              </div>
          </Modal>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                لا يوجد موردين مسجلين. ابدأ بإضافة مورد جديد.
            </div>
        )}
        {suppliers.map(sup => (
          <div key={sup.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
             <div className="flex justify-between items-start">
               <div className="flex items-center gap-3">
                 <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                   <Building2 size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-800 dark:text-white">{sup.name}</h3>
                   <p className="text-sm text-gray-500">{sup.contact}</p>
                 </div>
               </div>
             </div>
             <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
               <div>
                 <p className="text-xs text-gray-400">الرصيد المستحق</p>
                 <p className="text-lg font-bold text-red-600">{sup.balance.toLocaleString()} ج.م</p>
               </div>
               <button 
                onClick={() => openPaymentModal(sup)}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
               >
                   سداد دفعة
               </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- INVENTORY MODULE ---
export const InventoryModule: React.FC<{user: User | null}> = ({user}) => {
  // Use V3 Key for fresh start
  const [inventory, setInventory] = usePersistentState<InventoryItem[]>('inventory_data_v3', []);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({});

  const handleSave = () => {
    if(!newItem.name) return;
    const item: InventoryItem = {
      id: Date.now().toString(),
      sku: newItem.sku || `SKU-${String(inventory.length + 1).padStart(3, '0')}`,
      name: newItem.name,
      quantity: Number(newItem.quantity || 0),
      unit: newItem.unit || 'قطعة',
      unitPrice: Number(newItem.unitPrice || 0),
      reorderLevel: Number(newItem.reorderLevel || 0), // Default to 0
      category: newItem.category || 'عام'
    };
    setInventory([...inventory, item]);
    setShowModal(false);
    setNewItem({});
  };

  const handlePrintInventory = () => {
      const printWindow = window.open('', '', 'height=800,width=800');
      if (!printWindow) return;

      const rows = inventory.map(item => `
          <tr>
              <td>${item.sku}</td>
              <td>${item.name}</td>
              <td>${item.category}</td>
              <td>${item.quantity} ${item.unit}</td>
              <td>${item.unitPrice}</td>
              <td>${(item.quantity * item.unitPrice).toLocaleString()}</td>
          </tr>
      `).join('');

      printWindow.document.write(`
          <html dir="rtl">
          <head>
              <title>تقرير جرد المخزون</title>
              <style>
                  body { font-family: 'Cairo', sans-serif; padding: 20px; }
                  h1 { text-align: center; margin-bottom: 10px; }
                  .meta { text-align: center; margin-bottom: 20px; color: #666; }
                  table { width: 100%; border-collapse: collapse; }
                  th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                  th { background-color: #f2f2f2; }
                  .footer { margin-top: 30px; text-align: center; font-size: 12px; }
              </style>
          </head>
          <body>
              <h1>تقرير جرد المخزون الشامل</h1>
              <div class="meta">تاريخ الطباعة: ${new Date().toLocaleDateString()}</div>
              <table>
                  <thead>
                      <tr>
                          <th>الكود</th>
                          <th>الصنف</th>
                          <th>التصنيف</th>
                          <th>الكمية</th>
                          <th>سعر الوحدة</th>
                          <th>إجمالي القيمة</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${rows}
                  </tbody>
              </table>
              <div class="footer">تم طباعة هذا التقرير بواسطة نظام إنجاز المحاسبي</div>
              <script>window.print();</script>
          </body>
          </html>
      `);
      printWindow.document.close();
  };

  return (
    <div>
      <ModuleHeader 
        title="إدارة المخزون" 
        onAdd={() => setShowModal(true)} 
        addLabel="إضافة صنف" 
        onExport={() => exportToCSV(inventory, 'inventory')}
        onPrint={handlePrintInventory}
        printLabel="طباعة الجرد الكامل"
      />

      {showModal && (
        <Modal title="إضافة صنف جديد" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="اسم الصنف" className="col-span-2 p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewItem({...newItem, name: e.target.value})} />
              <input type="number" placeholder="الكمية الحالية" className="p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
              <input type="text" placeholder="الوحدة (كجم، قطعة...)" className="p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewItem({...newItem, unit: e.target.value})} />
              <input type="number" placeholder="سعر البيع" className="p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})} />
              <input type="number" placeholder="حد إعادة الطلب" className="p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewItem({...newItem, reorderLevel: Number(e.target.value)})} />
            </div>
            <button onClick={handleSave} className="w-full py-2 bg-blue-600 text-white rounded-lg">حفظ الصنف</button>
          </div>
        </Modal>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <SearchBar placeholder="بحث عن صنف..." />
        <table className="w-full text-right">
          <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-sm">
             <tr>
               <th className="px-6 py-4">الصنف</th>
               <th className="px-6 py-4">الكمية</th>
               <th className="px-6 py-4">السعر</th>
               <th className="px-6 py-4">الحالة</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
             {inventory.length === 0 ? (
                 <tr><td colSpan={4} className="text-center py-8 text-gray-400">المخزن فارغ. أضف أصناف جديدة.</td></tr>
             ) : (
             inventory.map(item => (
               <tr key={item.id} className="text-sm dark:text-gray-300">
                 <td className="px-6 py-4">
                    <div className="font-bold">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.sku}</div>
                 </td>
                 <td className="px-6 py-4">{item.quantity} {item.unit}</td>
                 <td className="px-6 py-4">{item.unitPrice} ج.م</td>
                 <td className="px-6 py-4">
                    {item.quantity <= item.reorderLevel ? (
                      <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full w-fit">
                         <AlertTriangle size={12} /> منخفض
                      </span>
                    ) : (
                      <span className="text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                         متوفر
                      </span>
                    )}
                 </td>
               </tr>
             )))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- EXPENSES MODULE ---
export const ExpensesModule: React.FC<{user: User | null}> = ({user}) => {
  // Use V3 Key for fresh start
  const [expenses, setExpenses] = usePersistentState<Expense[]>('expenses_data_v3', []);
  const [showModal, setShowModal] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({});

  const handleSave = () => {
    if(!newExpense.amount) return;
    const exp: Expense = {
      id: Date.now().toString(),
      category: newExpense.category || 'نثريات',
      description: newExpense.description || '',
      amount: Number(newExpense.amount),
      date: new Date().toISOString().split('T')[0],
      approvedBy: user?.name || 'Unknown'
    };
    setExpenses([exp, ...expenses]);
    setShowModal(false);
    setNewExpense({});
  };

  return (
     <div>
       <ModuleHeader title="المصروفات" onAdd={() => setShowModal(true)} addLabel="تسجيل مصروف" onExport={() => exportToCSV(expenses, 'expenses')} />

       {showModal && (
        <Modal title="تسجيل مصروف جديد" onClose={() => setShowModal(false)}>
           <div className="space-y-4">
             <input type="text" placeholder="البند / التصنيف" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewExpense({...newExpense, category: e.target.value})} />
             <input type="text" placeholder="الوصف" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
             <input type="number" placeholder="المبلغ" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
             <button onClick={handleSave} className="w-full py-2 bg-blue-600 text-white rounded-lg">حفظ</button>
           </div>
        </Modal>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-sm">
             <tr>
               <th className="px-6 py-4">البند</th>
               <th className="px-6 py-4">الوصف</th>
               <th className="px-6 py-4">المبلغ</th>
               <th className="px-6 py-4">التاريخ</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
             {expenses.length === 0 ? (
                 <tr><td colSpan={4} className="text-center py-8 text-gray-400">لا توجد مصروفات مسجلة</td></tr>
             ) : (
             expenses.map(exp => (
               <tr key={exp.id} className="text-sm dark:text-gray-300">
                 <td className="px-6 py-4 font-bold">{exp.category}</td>
                 <td className="px-6 py-4 text-gray-500">{exp.description}</td>
                 <td className="px-6 py-4 text-red-600 font-bold">-{exp.amount.toLocaleString()}</td>
                 <td className="px-6 py-4">{exp.date}</td>
               </tr>
             )))}
          </tbody>
        </table>
      </div>
     </div>
  );
};

// --- FINANCE MODULE ---
export const FinanceModule: React.FC<{user: User | null}> = ({user}) => {
    // Dynamic Finance Module reading from V3 Storage
    const [invoices] = usePersistentState<Invoice[]>('invoices_data_v3', []);
    const [expenses] = usePersistentState<Expense[]>('expenses_data_v3', []);
    const [suppliers] = usePersistentState<Supplier[]>('suppliers_data_v3', []);

    const totalIncome = invoices.reduce((acc, inv) => acc + (inv.status === 'PAID' ? inv.amount : 0), 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const cashOnHand = totalIncome - totalExpenses; // Simplified cash flow
    const totalReceivables = invoices.reduce((acc, inv) => acc + (inv.status === 'PENDING' ? inv.amount : 0), 0);
    const totalPayables = suppliers.reduce((acc, sup) => acc + sup.balance, 0);

    return (
        <div className="space-y-6">
            <ModuleHeader title="المالية والحسابات" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="bg-gradient-to-br from-green-600 to-teal-700 text-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold opacity-90">السيولة النقدية (الخزينة)</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-3xl font-bold" dir="ltr">{cashOnHand.toLocaleString()}</span>
                        <span className="text-sm opacity-80">ج.م</span>
                    </div>
                    <p className="mt-2 text-sm opacity-70">صافي التدفق النقدي</p>
                 </div>
                 <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold opacity-90">مديونيات لنا (عملاء)</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-3xl font-bold" dir="ltr">{totalReceivables.toLocaleString()}</span>
                        <span className="text-sm opacity-80">ج.م</span>
                    </div>
                    <p className="mt-2 text-sm opacity-70">فواتير مبيعات غير مدفوعة</p>
                 </div>
                 <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold opacity-90">مديونيات علينا (موردين)</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-3xl font-bold" dir="ltr">{totalPayables.toLocaleString()}</span>
                        <span className="text-sm opacity-80">ج.م</span>
                    </div>
                    <p className="mt-2 text-sm opacity-70">مستحقات للموردين</p>
                 </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="text-lg font-bold mb-4 dark:text-white">ملخص الوضع المالي</h3>
                {invoices.length === 0 && expenses.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <FileSpreadsheet size={48} className="mx-auto mb-2 opacity-50" />
                        <p>لا توجد بيانات مالية حتى الآن. ابدأ بتسجيل المبيعات والمشتريات.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                         <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded">
                             <span className="text-gray-600 dark:text-gray-300">إجمالي المبيعات (المسجلة)</span>
                             <span className="font-bold text-gray-800 dark:text-white">{invoices.reduce((a,b)=>a+b.amount,0).toLocaleString()} ج.م</span>
                         </div>
                         <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded">
                             <span className="text-gray-600 dark:text-gray-300">إجمالي المصروفات</span>
                             <span className="font-bold text-red-600">-{totalExpenses.toLocaleString()} ج.م</span>
                         </div>
                         <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                             <span className="text-blue-800 dark:text-blue-300 font-bold">صافي الربح التقديري</span>
                             <span className="font-bold text-blue-700 dark:text-blue-300">{(invoices.reduce((a,b)=>a+b.amount,0) - totalExpenses).toLocaleString()} ج.م</span>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- REPORTS MODULE ---
export const ReportsModule: React.FC<{user: User | null}> = ({user}) => {
    
    const handlePrintReport = (title: string) => {
        const printWindow = window.open('', '', 'height=800,width=800');
        if (!printWindow) return;

        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: 'Cairo', sans-serif; padding: 40px; text-align: center; }
                    .report-box { border: 2px solid #eee; padding: 40px; margin-top: 20px; }
                    h1 { margin-bottom: 20px; color: #333; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="report-box">
                    <p>هذه نسخة معاينة للطباعة.</p>
                    <p>سيتم ملء هذا التقرير بالبيانات الحقيقية عند توفر سجلات كافية في النظام.</p>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div>
            <ModuleHeader title="التقارير والإحصائيات" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { title: 'تقرير المبيعات الشهري', icon: TrendingUp, color: 'text-blue-600' },
                    { title: 'تقرير حركة المخزون', icon: Package, color: 'text-orange-600' },
                    { title: 'تقرير المصروفات والأرباح', icon: DollarSign, color: 'text-green-600' },
                    { title: 'تقرير أداء الموظفين', icon: UserIcon, color: 'text-purple-600' },
                    { title: 'كشف حساب موردين', icon: Building2, color: 'text-gray-600' },
                    { title: 'التقرير الضريبي', icon: FileText, color: 'text-red-600' },
                ].map((report, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => handlePrintReport(report.title)}
                        className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow text-right"
                    >
                        <div className={`p-4 bg-gray-50 dark:bg-slate-700 rounded-full ${report.color}`}>
                            <report.icon size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 dark:text-white">{report.title}</h3>
                            <p className="text-xs text-gray-400 mt-1">اضغط للعرض والطباعة</p>
                        </div>
                        <Printer size={20} className="text-gray-300" />
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- HR & PAYROLL MODULE ---
interface PayrollModuleProps {
    onCreateUser?: (user: User) => void;
    onUpdateUser?: (user: User) => void;
    onDeleteUser?: (userId: string) => void;
    user: User | null;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({ onCreateUser, onUpdateUser, onDeleteUser, user }) => {
    // Use V3 Key for fresh start - Initialize with 0 salary for admin placeholder
    const [employees, setEmployees] = usePersistentState<Employee[]>('employees_data_v3', [
        { id: 'admin-emp', name: 'المدير العام', position: 'Owner', baseSalary: 0, netSalary: 0, status: 'ACTIVE', joinDate: new Date().toISOString().split('T')[0], deductions: [], linkedUserId: 'super-admin-01' }
    ]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeductionModal, setShowDeductionModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showEditEmpModal, setShowEditEmpModal] = useState(false);
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [showStatementModal, setShowStatementModal] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form States
    const [newEmp, setNewEmp] = useState<Partial<Employee>>({});
    const [deduction, setDeduction] = useState({ type: 'QUARTER_DAY', reason: '' });
    const [advance, setAdvance] = useState({ amount: 0, reason: '' });
    const [userForm, setUserForm] = useState({ username: '', password: '', role: UserRole.VIEWER });

    const isOwner = user?.role === UserRole.OWNER;
    const isAdmin = user?.role === UserRole.ADMIN;
    const isManager = user?.role === UserRole.MANAGER;

    // Permissions logic
    const canManageUsers = isOwner || isAdmin || isManager; 

    const handleAddEmployee = () => {
        if(!newEmp.name || !newEmp.baseSalary) return;
        setEmployees([...employees, {
            id: Date.now().toString(),
            name: newEmp.name,
            position: newEmp.position || 'موظف',
            baseSalary: Number(newEmp.baseSalary),
            netSalary: Number(newEmp.baseSalary),
            status: 'ACTIVE',
            joinDate: new Date().toISOString().split('T')[0],
            deductions: []
        }]);
        setShowAddModal(false);
    };

    const handleUpdateEmployee = () => {
        if (!selectedEmp) return;
        setEmployees(employees.map(e => e.id === selectedEmp.id ? { ...selectedEmp } : e));
        setShowEditEmpModal(false);
    };

    const handleDeleteEmployee = (id: string) => {
      // Only Owner can delete
      if (!isOwner) return;
      if (id === 'admin-emp') {
          alert('لا يمكن حذف سجل المالك الرئيسي');
          return;
      }
      if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        setEmployees(employees.filter(e => e.id !== id));
      }
    }

    const handleApplyDeduction = () => {
        if(!selectedEmp) return;
        
        let deductionAmount = 0;
        const dailyRate = selectedEmp.baseSalary / 30;

        switch(deduction.type) {
            case 'QUARTER_DAY': deductionAmount = dailyRate * 0.25; break;
            case 'HALF_DAY': deductionAmount = dailyRate * 0.5; break;
            case 'FULL_DAY': deductionAmount = dailyRate * 1; break;
        }

        const updatedEmployees = employees.map(emp => {
            if(emp.id === selectedEmp.id) {
                return {
                    ...emp,
                    netSalary: emp.netSalary - deductionAmount,
                    deductions: [...emp.deductions, {
                        id: Date.now().toString(),
                        date: new Date().toISOString().split('T')[0],
                        amount: deductionAmount,
                        type: deduction.type as any,
                        reason: deduction.reason
                    }]
                };
            }
            return emp;
        });
        
        setEmployees(updatedEmployees);
        setShowDeductionModal(false);
    };

    const handleAdvance = () => {
        if(!selectedEmp || advance.amount <= 0) return;

        if (advance.amount > selectedEmp.netSalary) {
            alert("لا يمكن سحب مبلغ أكبر من صافي الراتب الحالي.");
            return;
        }

        const updatedEmployees = employees.map(emp => {
            if(emp.id === selectedEmp.id) {
                return {
                    ...emp,
                    netSalary: emp.netSalary - advance.amount,
                    deductions: [...emp.deductions, {
                        id: Date.now().toString(),
                        date: new Date().toISOString().split('T')[0],
                        amount: advance.amount,
                        type: 'ADVANCE', // Custom type for withdrawal
                        reason: advance.reason || 'سلفة من الراتب'
                    } as Deduction]
                };
            }
            return emp;
        });

        setEmployees(updatedEmployees);
        setShowAdvanceModal(false);
        setAdvance({ amount: 0, reason: '' });
        alert(`تم سحب مبلغ ${advance.amount} من راتب الموظف.`);
    };

    const handleSaveUser = () => {
        if(!selectedEmp || !onCreateUser || !userForm.username) return;
        
        // Check if editing existing user or creating new
        if (selectedEmp.linkedUserId) {
             if (onUpdateUser) {
                 const updatedUser: User = {
                     id: selectedEmp.linkedUserId,
                     username: userForm.username,
                     password: userForm.password || undefined, // Only update if provided
                     role: userForm.role,
                     name: selectedEmp.name
                 };
                 onUpdateUser(updatedUser);
                 alert("تم تحديث بيانات المستخدم بنجاح");
             }
        } else {
             const user: User = {
                id: `user-${selectedEmp.id}`,
                username: userForm.username,
                name: selectedEmp.name,
                role: userForm.role,
                password: userForm.password,
                permissions: []
            };
            onCreateUser(user);
            setEmployees(employees.map(emp => emp.id === selectedEmp.id ? {...emp, linkedUserId: user.id} : emp));
        }
        setShowUserModal(false);
    };

    const handleRemoveUserAccount = () => {
        if (!selectedEmp || !selectedEmp.linkedUserId || !onDeleteUser) return;
        
        if (window.confirm("هل أنت متأكد من حذف حساب الدخول لهذا الموظف؟ سيتمكن الموظف من البقاء في السجل ولكن لن يستطيع الدخول للنظام.")) {
            onDeleteUser(selectedEmp.linkedUserId);
            // Update local employee state to remove link
            setEmployees(employees.map(emp => emp.id === selectedEmp.id ? {...emp, linkedUserId: undefined} : emp));
            setShowUserModal(false);
        }
    };

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <ModuleHeader title="شؤون الموظفين" onAdd={canManageUsers ? () => setShowAddModal(true) : undefined} addLabel="إضافة موظف" />
            
            <SearchBar placeholder="بحث باسم الموظف أو الوظيفة..." onChange={setSearchTerm} />

            {/* Add Employee Modal */}
            {showAddModal && (
                <Modal title="إضافة موظف جديد" onClose={() => setShowAddModal(false)}>
                    <div className="space-y-4">
                        <input type="text" placeholder="اسم الموظف" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewEmp({...newEmp, name: e.target.value})} />
                        <input type="text" placeholder="المسمى الوظيفي" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewEmp({...newEmp, position: e.target.value})} />
                        <input type="number" placeholder="الراتب الأساسي" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setNewEmp({...newEmp, baseSalary: Number(e.target.value)})} />
                        <button onClick={handleAddEmployee} className="w-full py-2 bg-blue-600 text-white rounded-lg">حفظ البيانات</button>
                    </div>
                </Modal>
            )}

            {/* Edit Employee Modal */}
            {showEditEmpModal && selectedEmp && (
                <Modal title="تعديل بيانات الموظف والراتب" onClose={() => setShowEditEmpModal(false)}>
                    <div className="space-y-4">
                        <div>
                             <label className="text-sm dark:text-gray-300">اسم الموظف</label>
                             <input type="text" value={selectedEmp.name} onChange={e => setSelectedEmp({...selectedEmp, name: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                        </div>
                        <div>
                             <label className="text-sm dark:text-gray-300">المسمى الوظيفي</label>
                             <input type="text" value={selectedEmp.position} onChange={e => setSelectedEmp({...selectedEmp, position: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                        </div>
                        <div>
                             <label className="text-sm dark:text-gray-300 flex justify-between">
                                 الراتب الأساسي
                                 {!isOwner && <span className="text-xs text-red-500 font-bold">(تعديل الراتب خاص بالمالك فقط)</span>}
                             </label>
                             <input 
                                type="number" 
                                value={selectedEmp.baseSalary} 
                                onChange={e => setSelectedEmp({...selectedEmp, baseSalary: Number(e.target.value)})} 
                                disabled={!isOwner} 
                                className={`w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white ${!isOwner ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed opacity-70' : ''}`}
                             />
                        </div>
                        <button onClick={handleUpdateEmployee} className="w-full py-2 bg-blue-600 text-white rounded-lg">حفظ التعديلات</button>
                    </div>
                </Modal>
            )}

            {/* Deduction Modal */}
            {showDeductionModal && selectedEmp && (
                <Modal title={`تسجيل جزاء / خصم على: ${selectedEmp.name}`} onClose={() => setShowDeductionModal(false)}>
                    <div className="space-y-4">
                        <label className="block text-sm dark:text-gray-300">نوع الخصم</label>
                        <select className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setDeduction({...deduction, type: e.target.value})}>
                            <option value="QUARTER_DAY">ربع يوم (تأخير)</option>
                            <option value="HALF_DAY">نصف يوم</option>
                            <option value="FULL_DAY">يوم كامل (غياب)</option>
                        </select>
                        <input type="text" placeholder="سبب الخصم" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" onChange={e => setDeduction({...deduction, reason: e.target.value})} />
                        <button onClick={handleApplyDeduction} className="w-full py-2 bg-red-600 text-white rounded-lg">تطبيق الخصم</button>
                    </div>
                </Modal>
            )}

            {/* Advance/Withdrawal Modal */}
            {showAdvanceModal && selectedEmp && (
                <Modal title={`سحب من الراتب (سلفة) - ${selectedEmp.name}`} onClose={() => setShowAdvanceModal(false)}>
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-blue-800 dark:text-blue-200 text-sm">
                            صافي الراتب الحالي المتاح: <strong>{selectedEmp.netSalary.toLocaleString()} ج.م</strong>
                        </div>
                        <div>
                            <label className="block text-sm dark:text-gray-300 mb-1">المبلغ المراد سحبه</label>
                            <input type="number" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={advance.amount} onChange={e => setAdvance({...advance, amount: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-sm dark:text-gray-300 mb-1">ملاحظات / السبب</label>
                            <input type="text" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="مثال: سلفة منتصف الشهر" value={advance.reason} onChange={e => setAdvance({...advance, reason: e.target.value})} />
                        </div>
                        <button onClick={handleAdvance} className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">تأكيد السحب</button>
                    </div>
                </Modal>
            )}

            {/* Statement Modal */}
            {showStatementModal && selectedEmp && (
                <Modal title={`كشف حساب الرواتب والخصومات: ${selectedEmp.name}`} onClose={() => setShowStatementModal(false)}>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-700 p-3 rounded">
                            <span className="text-gray-600 dark:text-gray-300">الراتب الأساسي:</span>
                            <span className="font-bold dark:text-white">{selectedEmp.baseSalary.toLocaleString()} ج.م</span>
                        </div>
                        
                        <div className="overflow-x-auto max-h-80">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-100 dark:bg-slate-600 sticky top-0">
                                    <tr>
                                        <th className="p-2">التاريخ</th>
                                        <th className="p-2">النوع</th>
                                        <th className="p-2">المبلغ</th>
                                        <th className="p-2">السبب</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                                    {selectedEmp.deductions.map((d, idx) => (
                                        <tr key={idx}>
                                            <td className="p-2">{d.date}</td>
                                            <td className="p-2">
                                                <span className={`px-2 py-0.5 rounded text-xs ${d.type === 'ADVANCE' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                    {d.type === 'ADVANCE' ? 'سلفة / سحب' : 'خصم / جزاء'}
                                                </span>
                                            </td>
                                            <td className="p-2 font-bold">{d.amount.toLocaleString()}</td>
                                            <td className="p-2 text-gray-500">{d.reason || '-'}</td>
                                        </tr>
                                    ))}
                                    {selectedEmp.deductions.length === 0 && (
                                        <tr><td colSpan={4} className="p-4 text-center text-gray-500">لا توجد خصومات أو سلف مسجلة</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-800">
                            <span className="text-blue-800 dark:text-blue-200 font-bold">صافي الراتب المستحق:</span>
                            <span className="font-bold text-xl text-blue-700 dark:text-blue-300">{selectedEmp.netSalary.toLocaleString()} ج.م</span>
                        </div>
                        
                        <div className="flex justify-end mt-2">
                            <button onClick={() => {
                                const headers = "Date,Type,Amount,Reason";
                                const rows = selectedEmp.deductions.map(d => `${d.date},${d.type},${d.amount},"${d.reason}"`).join('\n');
                                const csvContent = "data:text/csv;charset=utf-8," + `\uFEFF${headers}\n${rows}`;
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", `statement_${selectedEmp.name}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
                                <Download size={16} /> تنزيل الكشف
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Create/Edit User Modal */}
            {showUserModal && selectedEmp && (
                <Modal title={selectedEmp.linkedUserId ? `تعديل صلاحيات: ${selectedEmp.name}` : `إنشاء حساب نظام لـ: ${selectedEmp.name}`} onClose={() => setShowUserModal(false)}>
                    <div className="space-y-4">
                        <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                             {isOwner ? "بصفتك المالك، لديك كامل الصلاحيات." : "يمكنك منح صلاحيات موظف، محاسب، أو مدير فرع."}
                        </div>
                        <input type="text" placeholder="اسم المستخدم (Username)" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                        <input type="password" placeholder={selectedEmp.linkedUserId ? "كلمة المرور الجديدة (اتركها فارغة للإبقاء)" : "كلمة المرور"} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                        
                        <label className="block text-sm dark:text-gray-300">الصلاحية (Role)</label>
                        <select className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                            <option value={UserRole.VIEWER}>مشاهدة فقط</option>
                            <option value={UserRole.SALES}>كاشير (مبيعات)</option>
                            <option value={UserRole.ACCOUNTANT}>محاسب</option>
                            <option value={UserRole.MANAGER}>مدير</option>
                            {isOwner && <option value={UserRole.ADMIN}>مدير نظام (Admin)</option>}
                            {isOwner && <option value={UserRole.OWNER}>مالك (Owner) - صلاحيات كاملة</option>}
                        </select>
                        
                        <button onClick={handleSaveUser} className="w-full py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700">
                            {selectedEmp.linkedUserId ? "تحديث بيانات الدخول" : "إنشاء الحساب"}
                        </button>

                        {/* Delete User Account Button - Owner Only */}
                        {isOwner && selectedEmp.linkedUserId && (
                             <div className="pt-4 border-t border-gray-100 dark:border-slate-700 mt-4">
                                <button 
                                    onClick={handleRemoveUserAccount} 
                                    className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center justify-center gap-2 border border-red-200"
                                >
                                    <UserMinus size={18} />
                                    <span>حذف حساب المستخدم نهائياً</span>
                                </button>
                             </div>
                        )}
                    </div>
                </Modal>
            )}

            <div className="grid grid-cols-1 gap-4 mt-4">
                 {filteredEmployees.map(emp => (
                     <div key={emp.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                         <div className="flex items-center gap-4 w-full md:w-auto">
                             <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                 {emp.name.charAt(0)}
                             </div>
                             <div>
                                 <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    {emp.name}
                                    {emp.linkedUserId && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] rounded-full">مستخدم نظام</span>}
                                 </h3>
                                 <p className="text-sm text-gray-500">{emp.position}</p>
                             </div>
                         </div>
                         <div className="flex flex-wrap items-center gap-4 justify-center md:justify-end w-full md:w-auto">
                             <div className="text-center px-4">
                                 <p className="text-xs text-gray-400">الراتب الصافي</p>
                                 <p className={`font-bold ${emp.netSalary < emp.baseSalary ? 'text-red-500' : 'dark:text-gray-200'}`}>{emp.netSalary.toLocaleString()} ج.م</p>
                             </div>
                             
                             <div className="flex gap-2">
                                {/* Only Owner/Admin/Manager can open Edit Modal, but inside modal Salary is restricted to Owner */}
                                {canManageUsers && (
                                   <button 
                                     onClick={() => { setSelectedEmp(emp); setShowEditEmpModal(true); }}
                                     className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 dark:bg-slate-700 rounded-lg"
                                     title="تعديل البيانات"
                                   >
                                     <Edit2 size={16} />
                                   </button>
                                )}
                                
                                <button 
                                    onClick={() => { setSelectedEmp(emp); setShowAdvanceModal(true); }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-sm"
                                    title="سحب من الراتب (سلفة)"
                                >
                                    <Wallet size={16} /> سلفة
                                </button>

                                <button 
                                    onClick={() => { setSelectedEmp(emp); setShowDeductionModal(true); }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm"
                                    title="توقيع جزاء"
                                >
                                    <Gavel size={16} /> خصم
                                </button>

                                <button 
                                    onClick={() => { setSelectedEmp(emp); setShowStatementModal(true); }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600 rounded-lg text-sm"
                                    title="كشف حساب الموظف"
                                >
                                    <FileText size={16} /> كشف
                                </button>
                                
                                {/* User Management Button - Restricted to Managers/Admins/Owners */}
                                {canManageUsers && (isOwner || (!emp.linkedUserId)) && (
                                    <button 
                                        onClick={() => { 
                                            setSelectedEmp(emp); 
                                            setUserForm({ username: '', password: '', role: UserRole.VIEWER }); // Reset form
                                            setShowUserModal(true); 
                                        }}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${emp.linkedUserId ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                        title={emp.linkedUserId ? "تعديل صلاحيات المستخدم" : "إنشاء مستخدم للنظام"}
                                    >
                                        <UserPlus size={16} /> {emp.linkedUserId ? 'تعديل يوزر' : 'يوزر'}
                                    </button>
                                )}

                                {isOwner && (
                                  <button
                                    onClick={() => handleDeleteEmployee(emp.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-lg text-sm transition-colors"
                                    title="حذف الموظف"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                             </div>
                         </div>
                     </div>
                 ))}
            </div>
        </div>
    );
};

// --- SETTINGS MODULE ---
export const SettingsModule: React.FC<{
  user: User | null;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
}> = ({user, toggleTheme, toggleLanguage, theme, language}) => {
  // Use V3 Key for fresh start - Default taxRate 0
  const [settings, setSettings] = usePersistentState<CompanySettings>('company_settings_v3', {
    name: 'شركتي',
    currency: 'ج.م',
    taxRate: 0,
    stockAlert: { mode: 'REORDER_LEVEL', value: 0 },
    aiFeatures: { financialAdvisor: true, cashFlowAnalysis: true }
  });

  const [permissions, setPermissions] = usePersistentState<RolePermission[]>('role_permissions_v3', [
      { role: UserRole.MANAGER, canEditSettings: false, canDeleteItems: true, canViewReports: true, canManageUsers: true },
      { role: UserRole.ACCOUNTANT, canEditSettings: false, canDeleteItems: false, canViewReports: true, canManageUsers: false },
      { role: UserRole.SALES, canEditSettings: false, canDeleteItems: false, canViewReports: false, canManageUsers: false },
      { role: UserRole.VIEWER, canEditSettings: false, canDeleteItems: false, canViewReports: false, canManageUsers: false },
  ]);

  const handlePermissionChange = (role: UserRole, field: keyof RolePermission) => {
    setPermissions(permissions.map(p => 
      p.role === role ? { ...p, [field]: !p[field] } : p
    ));
  };

  const handleSave = () => {
     alert("تم حفظ الإعدادات بنجاح");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <ModuleHeader title="إعدادات النظام" />

       <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
         <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
            <Building2 size={20} className="text-blue-500" />
            بيانات الشركة
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm dark:text-gray-300 mb-1">اسم الشركة</label>
               <input type="text" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
               <label className="block text-sm dark:text-gray-300 mb-1">العملة</label>
               <input type="text" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
               <label className="block text-sm dark:text-gray-300 mb-1">نسبة الضريبة (%)</label>
               <input type="number" value={settings.taxRate} onChange={e => setSettings({...settings, taxRate: Number(e.target.value)})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
            </div>
         </div>
       </div>

       {/* Custom Role Permissions (Owner Only) */}
       {user?.role === UserRole.OWNER && (
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
             <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
                <Sliders size={20} className="text-indigo-500" />
                إدارة صلاحيات الأدوار (Custom Permissions)
             </h3>
             <div className="overflow-x-auto">
                 <table className="w-full text-right text-sm">
                     <thead className="bg-gray-50 dark:bg-slate-700">
                         <tr>
                             <th className="p-3">الدور</th>
                             <th className="p-3">تعديل الإعدادات</th>
                             <th className="p-3">حذف البيانات</th>
                             <th className="p-3">عرض التقارير</th>
                             <th className="p-3">إدارة المستخدمين</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                         {permissions.map((perm) => (
                             <tr key={perm.role}>
                                 <td className="p-3 font-bold dark:text-white">{perm.role}</td>
                                 <td className="p-3">
                                     <input type="checkbox" checked={perm.canEditSettings} onChange={() => handlePermissionChange(perm.role, 'canEditSettings')} />
                                 </td>
                                 <td className="p-3">
                                     <input type="checkbox" checked={perm.canDeleteItems} onChange={() => handlePermissionChange(perm.role, 'canDeleteItems')} />
                                 </td>
                                 <td className="p-3">
                                     <input type="checkbox" checked={perm.canViewReports} onChange={() => handlePermissionChange(perm.role, 'canViewReports')} />
                                 </td>
                                 <td className="p-3">
                                     <input type="checkbox" checked={perm.canManageUsers} onChange={() => handlePermissionChange(perm.role, 'canManageUsers')} />
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         </div>
       )}

       <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
         <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
            <Package size={20} className="text-orange-500" />
            تنبيهات المخزون
         </h3>
         <div className="space-y-4">
             <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer dark:text-gray-300">
                    <input type="radio" name="stockMode" checked={settings.stockAlert.mode === 'REORDER_LEVEL'} onChange={() => setSettings({...settings, stockAlert: { ...settings.stockAlert, mode: 'REORDER_LEVEL' }})} />
                    حسب حد الطلب لكل صنف
                </label>
                <label className="flex items-center gap-2 cursor-pointer dark:text-gray-300">
                    <input type="radio" name="stockMode" checked={settings.stockAlert.mode === 'GLOBAL_MIN'} onChange={() => setSettings({...settings, stockAlert: { ...settings.stockAlert, mode: 'GLOBAL_MIN' }})} />
                    حد أدنى عام
                </label>
             </div>
             {settings.stockAlert.mode === 'GLOBAL_MIN' && (
                 <div>
                    <label className="block text-sm dark:text-gray-300 mb-1">الحد الأدنى للكمية (عام)</label>
                    <input type="number" value={settings.stockAlert.value} onChange={e => setSettings({...settings, stockAlert: { ...settings.stockAlert, value: Number(e.target.value) }})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white w-32" />
                 </div>
             )}
         </div>
       </div>

       <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
         <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
            <Monitor size={20} className="text-purple-500" />
            المظهر واللغة
         </h3>
         <div className="flex gap-4">
             <button onClick={toggleTheme} className="flex items-center gap-2 px-4 py-2 border rounded-lg dark:border-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700">
                 {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                 <span>{theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
             </button>
             <button onClick={toggleLanguage} className="flex items-center gap-2 px-4 py-2 border rounded-lg dark:border-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700">
                 <Globe size={18} />
                 <span>{language === 'ar' ? 'English' : 'العربية'}</span>
             </button>
         </div>
       </div>

       <div className="flex justify-end">
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">
              <Save size={18} />
              <span>حفظ التغييرات</span>
          </button>
       </div>
    </div>
  );
};