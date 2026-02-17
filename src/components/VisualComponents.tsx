import { X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';

// --- COMPONENTE DE TOAST (NOTIFICAÇÃO) ---
export function ToastContainer({ toasts }: { toasts: { id: number; message: string; type: 'success' | 'error' }[] }) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className={`pointer-events-auto animate-fade-in-left px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="font-medium text-sm">{toast.message}</span>
                </div>
            ))}
        </div>
    );
}

// --- COMPONENTE MODAL DE PRODUTO ---
interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    isEditing: boolean;
    nome: string; setNome: (v: string) => void;
    preco: string; setPreco: (v: string) => void;
    categoria: string; setCategoria: (v: any) => void;
    imagem: string; onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProductModal({ isOpen, onClose, onSubmit, loading, isEditing, nome, setNome, preco, setPreco, categoria, setCategoria, imagem, onImageUpload }: ProductModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            {/* Modal com bordas arredondadas no topo para mobile (Sheet style) */}
            <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-slide-up sm:animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-purple-900">{isEditing ? 'Editar Doce' : 'Novo Doce'}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X size={20}/></button>
                </div>
                <form onSubmit={onSubmit} className="space-y-5">
                    {/* Upload Area */}
                    <div className="relative w-full h-40 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center overflow-hidden hover:border-purple-500 transition-colors">
                        {imagem ? <img src={imagem}  className="w-full h-full object-cover" /> : (
                            <div className="text-center text-purple-400">
                                <ImageIcon className="mx-auto mb-2 opacity-50" />
                                <span className="text-xs font-bold uppercase tracking-wide">Adicionar Foto</span>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={onImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Nome</label>
                            <input type="text" placeholder="Ex: Bolo de Pote" value={nome} onChange={e => setNome(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all font-medium text-gray-800" required />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Preço</label>
                                <input type="number" placeholder="0,00" value={preco} onChange={e => setPreco(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all font-medium text-gray-800" required step="0.01" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Tipo</label>
                                <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-600 font-medium text-gray-800 appearance-none">
                                    <option value="pronta-entrega">Pronta</option>
                                    <option value="encomenda">Encomenda</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-lg text-white bg-purple-700 hover:bg-purple-800 shadow-lg shadow-purple-200 active:scale-95 transition-all">
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar Doce'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// --- COMPONENTE MODAL DE EXCLUSÃO ---
export function DeleteModal({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center animate-bounce-in">
                <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={28} />
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">Excluir item?</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">Essa ação é permanente e não pode ser desfeita.</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">Excluir</button>
                </div>
            </div>
        </div>
    );
}