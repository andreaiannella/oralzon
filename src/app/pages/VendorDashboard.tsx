import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Star, MessageSquare,
  Settings, TrendingUp, Upload, Sparkles, BarChart3, DollarSign,
  Users, Eye, Plus, FileSpreadsheet, ChevronDown, Search, Filter
} from 'lucide-react';

export function VendorDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [activeTab, setActiveTab] = useState('all');

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Panoramica' },
    { id: 'products', icon: Package, label: 'Prodotti' },
    { id: 'add-product', icon: Plus, label: 'Aggiungi Prodotto' },
    { id: 'import-excel', icon: FileSpreadsheet, label: 'Import Excel' },
    { id: 'orders', icon: ShoppingBag, label: 'Ordini' },
    { id: 'reviews', icon: Star, label: 'Recensioni' },
    { id: 'promotions', icon: Sparkles, label: 'Promozioni' },
    { id: 'messages', icon: MessageSquare, label: 'Messaggi' },
    { id: 'statistics', icon: BarChart3, label: 'Statistiche' },
    { id: 'settings', icon: Settings, label: 'Impostazioni' }
  ];

  const stats = [
    { label: 'Prodotti Pubblicati', value: '127', change: '+12', icon: Package, color: 'bg-accent0' },
    { label: 'Ordini Mensili', value: '89', change: '+23%', icon: ShoppingBag, color: 'bg-green-500' },
    { label: 'Fatturato Mensile', value: '€12,450', change: '+18%', icon: DollarSign, color: 'bg-accent0' },
    { label: 'Recensioni Medie', value: '4.8', change: '+0.2', icon: Star, color: 'bg-amber-500' }
  ];

  const recentOrders = [
    { id: '#ORD-1234', customer: 'Studio Dentistico Roma', products: 3, total: '€245.00', status: 'In preparazione', date: '14 Mag 2026' },
    { id: '#ORD-1233', customer: 'Clinica Dent Milano', products: 5, total: '€589.00', status: 'Spedito', date: '13 Mag 2026' },
    { id: '#ORD-1232', customer: 'Dr. Rossi Mario', products: 2, total: '€128.00', status: 'Consegnato', date: '12 Mag 2026' },
    { id: '#ORD-1231', customer: 'Dental Lab Torino', products: 8, total: '€1,234.00', status: 'In preparazione', date: '11 Mag 2026' }
  ];

  const products = [
    { id: 1, name: 'Turbina Dentale High Speed Premium', sku: 'TRB-001', price: '389.00', stock: 45, status: 'Pubblicato', sales: 234 },
    { id: 2, name: 'Kit Sterilizzazione Completo', sku: 'STR-045', price: '1,299.00', stock: 12, status: 'Pubblicato', sales: 156 },
    { id: 3, name: 'Lampada Fotopolimerizzante LED', sku: 'LMP-234', price: '249.00', stock: 8, status: 'Esaurito', sales: 189 },
    { id: 4, name: 'Guanti Nitrile Box 100pz', sku: 'GNT-099', price: '19.90', stock: 523, status: 'Pubblicato', sales: 1234 }
  ];

  const topProducts = [
    { name: 'Guanti Nitrile Professional', sales: 1234, revenue: '€24,556' },
    { name: 'Turbina Dentale Premium', sales: 234, revenue: '€91,026' },
    { name: 'Lampada LED Pro', sales: 189, revenue: '€47,061' },
    { name: 'Kit Sterilizzazione', sales: 156, revenue: '€202,644' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl mb-6">Benvenuto nella Dashboard</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-600 text-sm">{stat.change}</span>
              </div>
              <div className="text-3xl mb-1">{stat.value}</div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-border">
          <h3 className="text-xl mb-4">Ordini Recenti</h3>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="mb-1">{order.id}</div>
                  <div className="text-sm text-muted-foreground">{order.customer}</div>
                  <div className="text-xs text-muted-foreground mt-1">{order.date}</div>
                </div>
                <div className="text-right">
                  <div className="mb-1">{order.total}</div>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                    order.status === 'Consegnato' ? 'bg-green-100 text-green-700' :
                    order.status === 'Spedito' ? 'bg-accent text-primary' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-border">
          <h3 className="text-xl mb-4">Prodotti Top</h3>
          <div className="space-y-4">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-1">{product.name}</div>
                  <div className="text-sm text-muted-foreground">{product.sales} vendite</div>
                </div>
                <div className="text-right">
                  <div>{product.revenue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary to-secondary text-white rounded-xl p-8">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl mb-2">Promuovi i Tuoi Prodotti</h3>
            <p className="mb-6 opacity-90">
              Metti in evidenza i tuoi prodotti per aumentare le vendite
            </p>
            <button className="px-6 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors">
              Scopri le Promozioni
            </button>
          </div>
          <Sparkles className="w-16 h-16 opacity-50" />
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl">I Tuoi Prodotti</h2>
        <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Aggiungi Prodotto
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-border">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cerca prodotti..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button className="px-4 py-2 border border-border rounded-lg hover:bg-accent flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtri
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4">Prodotto</th>
                <th className="text-left p-4">SKU</th>
                <th className="text-left p-4">Prezzo</th>
                <th className="text-left p-4">Stock</th>
                <th className="text-left p-4">Vendite</th>
                <th className="text-left p-4">Stato</th>
                <th className="text-left p-4">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border hover:bg-muted">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>{product.name}</div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{product.sku}</td>
                  <td className="p-4">€{product.price}</td>
                  <td className="p-4">
                    <span className={product.stock < 10 ? 'text-red-600' : ''}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4">{product.sales}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      product.status === 'Pubblicato' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-primary hover:underline">Modifica</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderImportExcel = () => (
    <div className="space-y-6">
      <h2 className="text-3xl">Importazione Massiva Excel</h2>

      <div className="bg-white rounded-xl p-8 border border-border">
        <div className="max-w-2xl mx-auto text-center">
          <FileSpreadsheet className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-2xl mb-4">Carica il Tuo Catalogo</h3>
          <p className="text-muted-foreground mb-8">
            Importa centinaia di prodotti in pochi secondi tramite file Excel
          </p>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-xl p-12 hover:border-primary transition-colors cursor-pointer">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="mb-2">Trascina qui il file Excel oppure</p>
              <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                Seleziona File
              </button>
              <p className="text-sm text-muted-foreground mt-4">
                Formato supportato: .xlsx, .xls (max 10MB)
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-muted-foreground">oppure</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            <button className="w-full px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Scarica Template Excel
            </button>
          </div>
        </div>
      </div>

      <div className="bg-accent rounded-xl p-6 border border-border">
        <h3 className="mb-4">Come funziona l'importazione</h3>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">1</span>
            <span>Scarica il template Excel con tutti i campi necessari</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">2</span>
            <span>Compila il file con i dati dei tuoi prodotti</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">3</span>
            <span>Carica il file e controlla l'anteprima</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">4</span>
            <span>Correggi eventuali errori e pubblica i prodotti</span>
          </li>
        </ol>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex-shrink-0">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white">
              DT
            </div>
            <div>
              <div>DentalTech Pro</div>
              <div className="text-xs text-muted-foreground">Piano Professional</div>
            </div>
          </div>
        </div>

        <nav className="p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
                activeSection === item.id
                  ? 'bg-primary text-white'
                  : 'hover:bg-accent'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="bg-accent rounded-lg p-4">
            <div className="text-sm mb-2">Piano Professional</div>
            <div className="text-xs text-muted-foreground mb-3">
              245 / 500 prodotti utilizzati
            </div>
            <div className="w-full bg-white rounded-full h-2 mb-3">
              <div className="bg-primary h-2 rounded-full" style={{width: '49%'}}></div>
            </div>
            <Link to="/pricing-venditori" className="text-sm text-primary hover:underline">
              Upgrade Piano →
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'products' && renderProducts()}
        {activeSection === 'import-excel' && renderImportExcel()}
        {activeSection === 'add-product' && (
          <div className="bg-white rounded-xl p-8 border border-border">
            <h2 className="text-3xl mb-6">Aggiungi Nuovo Prodotto</h2>
            <p className="text-muted-foreground">Form aggiunta prodotto in fase di sviluppo...</p>
          </div>
        )}
        {activeSection === 'orders' && (
          <div className="bg-white rounded-xl p-8 border border-border">
            <h2 className="text-3xl mb-6">Ordini</h2>
            <p className="text-muted-foreground">Sezione ordini in fase di sviluppo...</p>
          </div>
        )}
      </main>
    </div>
  );
}
