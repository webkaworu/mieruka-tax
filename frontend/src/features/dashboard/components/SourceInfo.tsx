import { ExternalLink, FileText } from 'lucide-react';

interface SourceInfoProps {
  categoryName: string;
  sourceUrl?: string;
  sourceDetails?: {
    page?: number;
    [key: string]: any;
  };
  onClose: () => void;
}

export const SourceInfo = ({ categoryName, sourceUrl, sourceDetails, onClose }: SourceInfoProps) => {
  if (!sourceUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            データの出典根拠
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">対象費目</p>
            <p className="text-slate-900 font-medium">{categoryName}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">出典元資料</p>
            <p className="text-slate-700 text-sm">財務省：一般会計予算（ポイント）</p>
          </div>

          {sourceDetails?.page && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">掲載ページ</p>
              <p className="text-slate-900 font-medium">{sourceDetails.page} ページ付近</p>
            </div>
          )}

          <a 
            href={sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            原文PDFを開く
            <ExternalLink className="w-4 h-4" />
          </a>
          
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            ※ 行政公開資料からプログラムにより自動抽出しています。<br />
            正確な数値は必ず原文PDFでご確認ください。
          </p>
        </div>
      </div>
    </div>
  );
};
