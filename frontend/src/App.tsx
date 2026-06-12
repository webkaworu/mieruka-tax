import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Outlet, useNavigate } from 'react-router';
import { QueryProvider } from './providers/QueryProvider';
import { HomePage } from './pages/Home';
import { LayoutDashboard, Wallet, Home, Building2 } from 'lucide-react';

const DashboardPage = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.DashboardPage })));
const ProfilesPage = lazy(() => import('./pages/Profiles').then(m => ({ default: m.ProfilesPage })));
const TaxSimulatorForm = lazy(() => import('./features/simulator').then(m => ({ default: m.TaxSimulatorForm })));
const SimulatorResult = lazy(() => import('./features/simulator').then(m => ({ default: m.SimulatorResult })));

// シミュレーターページのラッパー
const SimulatorPage = () => (
    <div className="container mx-auto py-12 px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-4 lg:sticky lg:top-32">
                <Suspense fallback={<div className="h-64 bg-white border border-slate-100 rounded-xl animate-pulse" />}>
                    <TaxSimulatorForm />
                </Suspense>
            </div>
            <div className="lg:col-span-8">
                <Suspense fallback={<div className="h-96 bg-white border border-slate-100 rounded-xl animate-pulse" />}>
                    <SimulatorResult />
                </Suspense>
            </div>
        </div>
    </div>
);

// レイアウト共通コンポーネント（ヘッダー・フッターを含む）
const RootLayout = () => {
    const navigate = useNavigate();

    // NavLinkのスタイル関数
    const desktopNavClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
            isActive
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
        }`;

    const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
        `flex-1 min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${
            isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'
        }`;

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-sans text-[#333333] selection:bg-blue-100">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between gap-8">
                    {/* ロゴ */}
                    <div
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                            <span className="text-white font-black text-xl">T</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tighter leading-none">
                                TAX MIERUKA
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-widest uppercase">
                                税金の使い道見える化
                            </p>
                        </div>
                    </div>

                    {/* デスクトップナビ */}
                    <nav className="hidden xl:flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl ml-auto">
                        <NavLink to="/" end className={desktopNavClass}>
                            <Home className="w-4 h-4" />
                            ホーム
                        </NavLink>
                        <NavLink to="/explorer" className={desktopNavClass}>
                            <LayoutDashboard className="w-4 h-4" />
                            財政データ
                        </NavLink>
                        <NavLink to="/profiles" className={desktopNavClass}>
                            <Building2 className="w-4 h-4" />
                            組織別
                        </NavLink>
                        <NavLink to="/simulator" className={desktopNavClass}>
                            <Wallet className="w-4 h-4" />
                            マイ・タックス
                        </NavLink>
                    </nav>

                </div>

                {/* モバイルナビ */}
                <nav className="xl:hidden flex border-t border-slate-100 overflow-x-auto custom-scrollbar text-nowrap">
                    <NavLink to="/" end className={mobileNavClass}>
                        Home
                    </NavLink>
                    <NavLink to="/explorer" className={mobileNavClass}>
                        財政データ
                    </NavLink>
                    <NavLink to="/profiles" className={mobileNavClass}>
                        Profiles
                    </NavLink>
                    <NavLink to="/simulator" className={mobileNavClass}>
                        My Tax
                    </NavLink>
                </nav>
            </header>

            <main className="min-h-[calc(100vh-80px)]">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-sm font-bold text-slate-400">読み込み中...</p>
                    </div>
                }>
                    <Outlet />
                </Suspense>
            </main>

            <footer className="bg-white border-t border-slate-200 mt-20 py-12">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
                            <span className="text-white font-black text-sm">T</span>
                        </div>
                        <span className="font-black tracking-tighter text-sm uppercase">Tax Mieruka</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">
                        Data Source: Ministry of Finance Japan
                    </p>
                    <p className="text-slate-300 text-[10px]">
                        &copy; 2026 TAX MIERUKA PROJECT. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

function App() {
    return (
        <QueryProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<RootLayout />}>
                        <Route index element={<HomePage />} />
                        <Route path="/explorer" element={<DashboardPage />} />
                        <Route path="/profiles" element={<ProfilesPage />} />
                        <Route path="/simulator" element={<SimulatorPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryProvider>
    );
}

export default App;
