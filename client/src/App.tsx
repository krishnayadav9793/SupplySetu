import { ShoppingCart, Package, Sparkles } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-brand-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Supply<span className="text-brand-600">Setu</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
              B2B Distribution
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
              <ShoppingCart className="h-4 w-4" />
              <span>Cart (0)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-2xl mx-auto">
          <div className="inline-flex p-3 rounded-full bg-brand-50 text-brand-600 mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            SupplySetu Frontend Initialized
          </h1>
          <p className="text-slate-600 mb-6">
            React + TypeScript + Vite + Tailwind CSS configured successfully.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Framework</p>
              <p className="text-sm font-semibold text-slate-800">React 18 + Vite</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Styling</p>
              <p className="text-sm font-semibold text-slate-800">Tailwind CSS v3</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Type Safety</p>
              <p className="text-sm font-semibold text-slate-800">TypeScript 5</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        SupplySetu &copy; {new Date().getFullYear()} - FMCG AI-Powered Distribution
      </footer>
    </div>
  );
}
