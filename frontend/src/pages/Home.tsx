import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LayoutDashboard, Wallet, ArrowRight, ShieldCheck, Search, Database } from 'lucide-react';
import { useExpenditures } from '@/features/dashboard';

const BudgetCounter = ({ totalBudget }: { totalBudget: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = totalBudget;
        const duration = 2000;
        const increment = end / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, 16);

        return () => clearInterval(timer);
    }, [totalBudget]);

    return (
        <div className="py-12 bg-white rounded-[40px] shadow-2xl shadow-blue-100 border border-slate-100 max-w-3xl mx-auto overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
                Total National Budget (General Account)
            </p>
            <div className="text-4xl md:text-6xl font-black text-slate-900 tabular-nums">
                ¥{Math.floor(count).toLocaleString()}
            </div>
            <p className="mt-4 text-sm font-bold text-slate-500">
                令和6年度 一般会計予算（概算）
            </p>
        </div>
    );
};

export const HomePage = () => {
    const navigate = useNavigate();
    const { data: expenditures } = useExpenditures({ year: 2024, lg_code: '000000' });

    // 総額の計算 (112兆円規模を想定)
    const totalBudget = expenditures?.reduce((sum: number, item: any) => sum + item.amount, 0) || 112571700000000;

    return (
        <div className="container mx-auto py-12 px-6 max-w-7xl space-y-20 pb-20">
            {/* Hero Section */}
            <section className="text-center space-y-8 pt-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-widest border border-blue-100 animate-bounce">
                    <ShieldCheck className="w-3 h-3" />
                    Fiscal Year 2024 Live Data
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-tight max-w-4xl mx-auto">
                    日本の税金の使い道を、<br />
                    <span className="text-blue-600">もっと透明に。</span>
                </h2>
                <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                    複雑な国家予算データを直感的なチャートで解説。
                    あなたの納めた税金が、どこで社会を支えているかを確認しましょう。
                </p>

                {/* Dynamic Counter */}
                <BudgetCounter totalBudget={totalBudget} />
            </section>

            {/* Feature Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button
                    onClick={() => navigate('/explorer')}
                    className="group text-left p-10 rounded-[32px] bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300 relative overflow-hidden"
                >
                    <div className="relative z-10 space-y-6">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <LayoutDashboard className="w-7 h-7 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black mb-2">支出エクスプローラー</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                全112兆円の予算の内訳を、カテゴリー別に詳細まで探索。ドリルダウン機能で1円単位の使途まで追いかけます。
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-black text-blue-400">
                            詳しく見る <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl" />
                </button>

                <button
                    onClick={() => navigate('/simulator')}
                    className="group text-left p-10 rounded-[32px] bg-white border border-slate-200 hover:border-blue-600 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-50"
                >
                    <div className="relative z-10 space-y-6">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Wallet className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black mb-2 text-slate-900">マイ・タックス</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                あなたの納税額から、具体的な社会への貢献度を算出。おにぎりやコーヒーといった身近な単位で実感できます。
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-black text-blue-600">
                            計算を始める <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-slate-100 rounded-full blur-3xl group-hover:bg-blue-50 transition-colors" />
                </button>
            </section>

            {/* Info Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-10 border-t border-slate-100">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Search className="w-5 h-5 text-blue-600" />
                        <h4 className="font-black text-slate-900 uppercase text-sm tracking-wider">Searchable</h4>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        行政の複雑なPDF資料を構造化データに変換。キーワード一つで、気になる予算を瞬時に見つけ出せます。
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-blue-600" />
                        <h4 className="font-black text-slate-900 uppercase text-sm tracking-wider">Open Data</h4>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        収集されたデータはAPIとして公開。研究者やエンジニアが自由に二次利用できるプラットフォームを目指します。
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <h4 className="font-black text-slate-900 uppercase text-sm tracking-wider">Traceable</h4>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        全ての数値に「出典（エビデンス）」を明記。財務省の原文ページへ直接アクセスでき、情報の正確性を保証します。
                    </p>
                </div>
            </section>
        </div>
    );
};
