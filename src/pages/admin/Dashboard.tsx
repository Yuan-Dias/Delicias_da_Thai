import { useEffect, useState } from 'react';
import {
    Plus, Store, Truck, Pencil, Clock, Save, X, Loader2, Trash2, MapPin,
    Cookie, Croissant, Cake, Sparkles, Settings, Package
} from 'lucide-react';
import { db } from '../../services/firebase';
import {
    collection, addDoc, updateDoc, onSnapshot, deleteDoc,
    doc, query, orderBy, getDoc, setDoc
} from 'firebase/firestore';
import { ToastContainer, ProductModal, DeleteModal } from '../../components/VisualComponents';

// --- TIPOS ---
interface Produto {
    id: string;
    nome: string;
    preco: number;
    categoria: 'pronta-entrega' | 'encomenda';
    imagem: string;
    disponivel: boolean;
}
interface TaxaEntrega { id: string; bairro: string; valor: number; }
interface DiaFuncionamento { id: string; nome: string; aberto: boolean; inicio: string; fim: string; }
interface ToastNotification { id: number; message: string; type: 'success' | 'error'; }

export function Dashboard() {
    const [activeTab, setActiveTab] = useState<'produtos' | 'entregas' | 'config'>('produtos');
    const [toasts, setToasts] = useState<ToastNotification[]>([]);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }

    // --- ESTADOS ---
    const [lojaAberta, setLojaAberta] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState<{show: boolean, collection?: string, id?: string} | null>(null);

    // Dados
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [taxas, setTaxas] = useState<TaxaEntrega[]>([]);

    // Formulários Produto
    const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
    const [salvandoProduto, setSalvandoProduto] = useState(false);
    const [editandoProdutoId, setEditandoProdutoId] = useState<string | null>(null);
    const [novoNome, setNovoNome] = useState('');
    const [novoPreco, setNovoPreco] = useState('');
    const [novaCategoria, setNovaCategoria] = useState<'pronta-entrega' | 'encomenda'>('pronta-entrega');
    const [imagemBase64, setImagemBase64] = useState('');

    // Formulários Taxa
    const [editandoTaxaId, setEditandoTaxaId] = useState<string | null>(null);
    const [novoBairro, setNovoBairro] = useState('');
    const [novaTaxa, setNovaTaxa] = useState('');

    // Configurações Gerais
    const [entregaAtiva, setEntregaAtiva] = useState(true);
    const [logoLoja, setLogoLoja] = useState('');
    const [enderecoLoja, setEnderecoLoja] = useState('');
    const [salvandoConfig, setSalvandoConfig] = useState(false);

    // Horários
    const diasIniciais: DiaFuncionamento[] = [
        { id: '1', nome: 'Segunda', aberto: true, inicio: '13:00', fim: '19:00' },
        { id: '2', nome: 'Terça', aberto: true, inicio: '13:00', fim: '19:00' },
        { id: '3', nome: 'Quarta', aberto: true, inicio: '13:00', fim: '19:00' },
        { id: '4', nome: 'Quinta', aberto: true, inicio: '13:00', fim: '19:00' },
        { id: '5', nome: 'Sexta', aberto: true, inicio: '13:00', fim: '19:00' },
        { id: '6', nome: 'Sábado', aberto: true, inicio: '10:00', fim: '18:00' },
        { id: '0', nome: 'Domingo', aberto: false, inicio: '', fim: '' },
    ];
    const [horarios, setHorarios] = useState<DiaFuncionamento[]>(diasIniciais);

    // --- CARREGAMENTO ---
    useEffect(() => {
        async function carregarDados() {
            try {
                const docStatusRef = doc(db, "config", "status_loja");
                const docStatusSnap = await getDoc(docStatusRef);
                if (docStatusSnap.exists()) setLojaAberta(docStatusSnap.data().aberta);

                const docConfigRef = doc(db, "config", "loja");
                const docConfigSnap = await getDoc(docConfigRef);

                if (docConfigSnap.exists()) {
                    const data = docConfigSnap.data();
                    if (data.horarios) setHorarios(data.horarios);
                    if (data.entregaAtiva !== undefined) setEntregaAtiva(data.entregaAtiva);
                    if (data.logo) setLogoLoja(data.logo);
                    if (data.endereco) setEnderecoLoja(data.endereco);
                }
            } catch (error) { console.error(error); }
            finally { setLoadingStatus(false); }
        }
        carregarDados();

        const unsubProdutos = onSnapshot(query(collection(db, "produtos"), orderBy("nome")), (s) =>
            setProdutos(s.docs.map(d => ({ id: d.id, ...d.data() })) as Produto[])
        );
        const unsubTaxas = onSnapshot(query(collection(db, "taxas_entrega"), orderBy("bairro")), (s) => {
            setTaxas(s.docs.map(d => ({ id: d.id, ...d.data() })) as TaxaEntrega[]);
            setLoading(false);
        });

        return () => { unsubProdutos(); unsubTaxas(); };
    }, []);

    // --- AÇÕES ---

    const toggleLoja = async () => {
        const novoStatus = !lojaAberta;
        setLojaAberta(novoStatus);
        try {
            await setDoc(doc(db, "config", "status_loja"), { aberta: novoStatus });
            showToast(novoStatus ? "Loja Aberta!" : "Loja Fechada!");
        } catch {
            setLojaAberta(!novoStatus);
            showToast("Erro ao alterar status", "error");
        }
    };

    const salvarConfiguracoes = async () => {
        setSalvandoConfig(true);
        try {
            await setDoc(doc(db, "config", "loja"), {
                horarios,
                entregaAtiva,
                logo: logoLoja,
                endereco: enderecoLoja
            }, { merge: true });

            showToast("Configurações salvas!");
        } catch (error) {
            console.error(error);
            showToast("Erro ao salvar (Imagem muito grande?)", "error");
        }
        finally { setSalvandoConfig(false); }
    };

    const handleImagemProduto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 800 * 1024) return showToast("Imagem muito grande (Max 800kb)", "error");
        const reader = new FileReader();
        reader.onloadend = () => setImagemBase64(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSalvarProduto = async (e: React.FormEvent) => {
        e.preventDefault();
        setSalvandoProduto(true);
        try {
            const dados = {
                nome: novoNome,
                preco: parseFloat(novoPreco.replace(',', '.')),
                categoria: novaCategoria,
                imagem: imagemBase64 || "https://placehold.co/400x400/ede9fe/8b5cf6?text=Doce",
                atualizadoEm: new Date(),
                disponivel: editandoProdutoId ? (produtos.find(p => p.id === editandoProdutoId)?.disponivel ?? true) : true
            };

            if (editandoProdutoId) {
                await updateDoc(doc(db, "produtos", editandoProdutoId), dados);
                showToast("Produto atualizado!");
            } else {
                await addDoc(collection(db, "produtos"), { ...dados, criadoEm: new Date(), disponivel: true });
                showToast("Produto criado!");
            }
            setModalProdutoAberto(false);
        } catch (error) {
            console.error(error);
            showToast("Erro ao salvar", "error");
        } finally {
            setSalvandoProduto(false);
        }
    };

    const handleSalvarTaxa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoBairro || !novaTaxa) return;
        try {
            const valor = parseFloat(novaTaxa.replace(',', '.'));
            if (editandoTaxaId) {
                await updateDoc(doc(db, "taxas_entrega", editandoTaxaId), { bairro: novoBairro, valor });
                setEditandoTaxaId(null);
                showToast("Taxa atualizada!");
            } else {
                await addDoc(collection(db, "taxas_entrega"), { bairro: novoBairro, valor });
                showToast("Bairro adicionado!");
            }
            setNovoBairro(''); setNovaTaxa('');
        } catch { showToast("Erro ao salvar taxa", "error"); }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 800 * 1024) {
                return showToast("Logo muito grande! Max 800kb.", "error");
            }
            const reader = new FileReader();
            reader.onloadend = () => setLogoLoja(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoverLogo = () => {
        setLogoLoja('');
        showToast("Logo removida. Clique em Salvar.");
    };

    function abrirNovo() {
        setEditandoProdutoId(null); setNovoNome(''); setNovoPreco(''); setNovaCategoria('pronta-entrega'); setImagemBase64(''); setModalProdutoAberto(true);
    }
    function abrirEdicao(p: Produto) {
        setEditandoProdutoId(p.id); setNovoNome(p.nome); setNovoPreco(p.preco.toString()); setNovaCategoria(p.categoria); setImagemBase64(p.imagem); setModalProdutoAberto(true);
    }
    async function confirmarExclusao() {
        if (!confirmDelete?.collection || !confirmDelete?.id) return;
        try {
            await deleteDoc(doc(db, confirmDelete.collection, confirmDelete.id));
            showToast("Item excluído.");
        } catch { showToast("Erro ao excluir", "error"); }
        finally { setConfirmDelete(null); }
    }


    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-50">
            <Loader2 className="animate-spin text-brand-500 w-10 h-10" />
        </div>
    );

    return (
        // Fundo agora é brand-50 para imersão total
        <div className="min-h-screen bg-brand-50 font-sans pb-32">
            <ToastContainer toasts={toasts} />

            {/* --- HEADER (USANDO BRAND-600) --- */}
            <header className="relative bg-brand-600 pb-20 pt-8 overflow-hidden rounded-b-[3rem] shadow-2xl shadow-brand-900/20">

                {/* BACKGROUND ICONS - Cores ajustadas para a paleta brand */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <Cookie className="absolute top-10 -left-6 text-brand-800 opacity-10 rotate-12" size={120} />
                    <Croissant className="absolute top-20 -right-8 text-brand-400 opacity-20 -rotate-12" size={140} />
                    <Cake className="absolute -bottom-10 left-10 text-brand-900 opacity-10 rotate-45" size={100} />
                    <Sparkles className="absolute top-4 right-10 text-white opacity-20 animate-pulse" size={24} />
                </div>

                <div className="max-w-md mx-auto px-6 relative z-10 flex flex-col items-center text-center">

                    {/* Logo & Título */}
                    <div className="flex flex-col items-center gap-3 mb-6">
                        <div className="p-1 bg-white/20 rounded-full backdrop-blur-sm">
                            <div className="bg-white p-1 rounded-full shadow-lg">
                                {logoLoja ? (
                                    <img src={logoLoja} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-brand-100" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-400">
                                        <Store size={28} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-white">
                            <span className="block text-xs font-bold tracking-[0.2em] opacity-90 uppercase mb-1">Painel Administrativo</span>
                            <h1 className="font-script text-4xl text-brand-50 drop-shadow-md rotate-[-2deg]">
                                Gerenciar Loja
                            </h1>
                        </div>
                    </div>

                    {/* ABAS (Estilo Filtro da Home) */}
                    <div className="flex justify-center w-full">
                        <div className="inline-flex bg-white/20 backdrop-blur-md p-1.5 rounded-[1.5rem] shadow-lg border border-white/10 w-full max-w-sm">
                            {[
                                { id: 'produtos', label: 'Doces', icon: <Cake size={14} /> },
                                { id: 'entregas', label: 'Entrega', icon: <Truck size={14} /> },
                                { id: 'config', label: 'Ajustes', icon: <Settings size={14} /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all duration-300
                                        ${activeTab === tab.id
                                        ? 'bg-white text-brand-600 shadow-md'
                                        : 'text-brand-100 hover:text-white hover:bg-white/10'}`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <main className="max-w-xl mx-auto px-4 -mt-8 relative z-20 space-y-6">

                {/* CARD STATUS DA LOJA */}
                <div className="bg-white p-4 rounded-[1.8rem] shadow-lg border border-brand-100 flex items-center justify-between animate-fade-in-up">
                    <div className="flex items-center gap-4">
                        {/* Mantive Emerald/Red para status semântico, mas suavizei o fundo */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${lojaAberta ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {loadingStatus ? <Loader2 className="animate-spin" size={20}/> : <Store size={24} />}
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status Atual</p>
                            <h2 className={`text-lg font-bold ${lojaAberta ? 'text-emerald-600' : 'text-red-500'}`}>
                                {lojaAberta ? 'Loja Aberta' : 'Loja Fechada'}
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={toggleLoja}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wide uppercase transition-all shadow-md active:scale-95
                        ${lojaAberta
                            ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                            : 'bg-brand-500 text-white shadow-brand-200 hover:bg-brand-600'}`}
                    >
                        {lojaAberta ? 'Fechar' : 'Abrir'}
                    </button>
                </div>

                {/* ABA PRODUTOS */}
                {activeTab === 'produtos' && (
                    <div className="space-y-4 animate-fade-in-up">
                        <button
                            onClick={abrirNovo}
                            // Borda tracejada e cores ajustadas para brand
                            className="w-full py-4 bg-white border-2 border-dashed border-brand-200 text-brand-400 rounded-[1.8rem] font-bold flex items-center justify-center gap-2 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-600 transition-all group shadow-sm"
                        >
                            <div className="bg-brand-100 p-2 rounded-full group-hover:scale-110 transition-transform text-brand-600"><Plus size={18}/></div>
                            Adicionar Nova Delícia
                        </button>

                        <div className="grid grid-cols-1 gap-4">
                            {produtos.map((produto) => (
                                <div key={produto.id} className="group bg-white p-3 rounded-[1.8rem] shadow-sm hover:shadow-xl hover:shadow-brand-100/50 transition-all duration-300 flex items-center gap-4 border border-brand-50">

                                    {/* Imagem do Produto */}
                                    <div className="w-20 h-20 rounded-[1.3rem] overflow-hidden shrink-0 bg-brand-50 relative">
                                        <img src={produto.imagem} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>

                                    {/* Informações Centrais (Nome e Preço) */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-bold text-brand-900 text-sm leading-tight truncate">{produto.nome}</h4>

                                            <div className={`shrink-0 p-1 rounded-full ${produto.disponivel ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {produto.disponivel ? <Package size={10} /> : <Clock size={10} />}
                                            </div>
                                        </div>
                                        <p className="text-brand-600 font-extrabold text-base">R$ {produto.preco.toFixed(2).replace('.', ',')}</p>

                                        <p className={`text-[9px] font-bold uppercase ${produto.disponivel ? 'text-emerald-500' : 'text-orange-500'}`}>
                                            {produto.disponivel ? 'Pronta Entrega Ativa' : 'Apenas sob encomenda'}
                                        </p>
                                    </div>

                                    {/* Coluna de Ações (Direita) */}
                                    <div className="flex flex-col items-end gap-3 shrink-0 pl-2 border-l border-brand-50">

                                        {/* Botões Editar/Excluir */}
                                        <div className="flex gap-2">
                                            <button onClick={() => abrirEdicao(produto)} className="w-8 h-8 rounded-full bg-brand-50 text-brand-400 hover:bg-brand-100 hover:text-brand-600 flex items-center justify-center transition-colors shadow-sm">
                                                <Pencil size={14}/>
                                            </button>
                                            <button onClick={() => setConfirmDelete({ show: true, collection: "produtos", id: produto.id })} className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm">
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>

                                        {/* Controle de Estoque (Switch) */}
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-bold uppercase tracking-tighter ${produto.disponivel ? 'text-emerald-500' : 'text-gray-400'}`}>
                                                {produto.disponivel ? 'Disponível' : 'Encomenda'}
                                            </span>
                                            <button
                                                onClick={async () => {
                                                    const novoStatus = !produto.disponivel;

                                                    const novosDados: any = {
                                                        disponivel: novoStatus
                                                    };

                                                    if (novoStatus === true) {
                                                        novosDados.categoria = 'pronta-entrega';
                                                    }

                                                    await updateDoc(doc(db, "produtos", produto.id), novosDados);
                                                    showToast(novoStatus ? "Produto em Pronta Entrega!" : "Marcado como Esgotado!");
                                                }}
                                                className={`w-9 h-5 rounded-full relative transition-colors shadow-inner ${produto.disponivel ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${produto.disponivel ? 'left-5' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ABA ENTREGAS */}
                {activeTab === 'entregas' && (
                    <div className="space-y-5 animate-fade-in-up">
                        <form onSubmit={handleSalvarTaxa} className="bg-white p-4 rounded-[1.8rem] shadow-sm border border-brand-100 space-y-3">
                            <h3 className="text-sm font-bold text-brand-800 ml-1 flex items-center gap-2"><MapPin size={16} className="text-brand-500"/> Adicionar Bairro</h3>
                            <div className="flex gap-2">
                                {/* Inputs com focus ring da marca */}
                                <input type="text" value={novoBairro} onChange={e => setNovoBairro(e.target.value)} placeholder="Nome do Bairro" className="flex-[2] px-4 py-3 bg-brand-50 rounded-2xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-brand-200 text-brand-900 placeholder-brand-300" />
                                <input type="number" step="0.01" value={novaTaxa} onChange={e => setNovaTaxa(e.target.value)} placeholder="R$" className="flex-1 px-4 py-3 bg-brand-50 rounded-2xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-brand-200 text-brand-900 placeholder-brand-300" />
                            </div>
                            <div className="flex gap-2">
                                {editandoTaxaId && <button type="button" onClick={() => { setEditandoTaxaId(null); setNovoBairro(''); setNovaTaxa(''); }} className="px-4 bg-gray-100 rounded-xl text-gray-500"><X size={18}/></button>}
                                {/* Botão Principal Brand-500 */}
                                <button type="submit" className="w-full bg-brand-500 text-white rounded-xl font-bold py-3 shadow-lg shadow-brand-200 hover:bg-brand-600 transition-all text-sm">
                                    {editandoTaxaId ? 'Salvar Alteração' : 'Adicionar'}
                                </button>
                            </div>
                        </form>

                        <div className="space-y-2">
                            {taxas.map(taxa => (
                                <div key={taxa.id} className="bg-white px-4 py-3 rounded-[1.5rem] border border-brand-100 flex justify-between items-center shadow-sm">
                                    <span className="font-bold text-brand-800 text-sm">{taxa.bairro}</span>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold text-xs px-3 py-1 rounded-full ${taxa.valor === 0 ? 'bg-brand-50 text-brand-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {taxa.valor === 0 ? "Combinar" : `R$ ${taxa.valor.toFixed(2)}`}
                                        </span>
                                        <div className="flex gap-1">
                                            <button onClick={() => { setEditandoTaxaId(taxa.id); setNovoBairro(taxa.bairro); setNovaTaxa(taxa.valor.toString()); }} className="p-1.5 text-brand-300 hover:text-brand-600 hover:bg-brand-50 rounded-full"><Pencil size={14} /></button>
                                            <button onClick={() => setConfirmDelete({ show: true, collection: "taxas_entrega", id: taxa.id })} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ABA AJUSTES */}
                {activeTab === 'config' && (
                    <div className="space-y-5 animate-fade-in-up">

                        {/* ENDEREÇO */}
                        <div className="bg-white p-5 rounded-[1.8rem] shadow-sm border border-brand-100">
                            <h3 className="font-bold text-brand-800 text-sm mb-3 flex items-center gap-2">
                                <MapPin size={18} className="text-brand-600"/> Endereço Exibido
                            </h3>
                            <textarea
                                value={enderecoLoja}
                                onChange={(e) => setEnderecoLoja(e.target.value)}
                                placeholder="Digite o endereço completo..."
                                className="w-full p-4 bg-brand-50 rounded-2xl border-none outline-none font-medium text-sm min-h-[80px] focus:ring-2 focus:ring-brand-200 resize-none text-brand-900 placeholder-brand-300"
                            />
                        </div>

                        {/* DELIVERY TOGGLE */}
                        <div className="bg-white p-4 rounded-[1.8rem] shadow-sm border border-brand-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-2xl ${entregaAtiva ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Truck size={20} />
                                </div>
                                <span className="font-bold text-brand-800 text-sm">Aceitar Delivery</span>
                            </div>
                            <button onClick={() => setEntregaAtiva(!entregaAtiva)} className={`w-12 h-7 rounded-full transition-colors relative ${entregaAtiva ? 'bg-brand-500' : 'bg-gray-200'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-all ${entregaAtiva ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* LOGO */}
                        <div className="bg-white p-5 rounded-[1.8rem] shadow-sm border border-brand-100 text-center">
                            <h3 className="font-bold text-brand-800 text-sm mb-4 text-left flex items-center gap-2"><Store size={18} className="text-brand-600"/> Logo da Loja</h3>
                            <div className="w-24 h-24 bg-brand-50 rounded-full mx-auto mb-4 border-2 border-dashed border-brand-200 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-brand-400 transition-colors">
                                {logoLoja ? <img src={logoLoja} className="w-full h-full object-cover" /> : <span className="text-xs text-brand-400 font-bold px-2">Clique p/ alterar</span>}
                                <input type="file" onChange={handleLogoUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            {logoLoja && (
                                <button onClick={handleRemoverLogo} className="text-red-500 text-xs font-bold py-1 px-3 bg-red-50 rounded-full hover:bg-red-100">Remover Logo</button>
                            )}
                        </div>

                        {/* HORÁRIOS */}
                        <div className="bg-white p-5 rounded-[1.8rem] shadow-sm border border-brand-100">
                            <h3 className="font-bold text-brand-800 text-sm mb-4 flex items-center gap-2"><Clock size={18} className="text-brand-600"/> Horários</h3>
                            <div className="space-y-3">
                                {horarios.map((dia, idx) => (
                                    <div key={dia.id} className="flex items-center justify-between py-1 border-b border-brand-50 last:border-0 pb-2 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            {/* Checkbox cor Brand */}
                                            <input type="checkbox" checked={dia.aberto} onChange={(e) => { const h = [...horarios]; h[idx].aberto = e.target.checked; setHorarios(h); }} className="w-4 h-4 accent-brand-600 rounded" />
                                            <span className={`font-bold text-xs uppercase ${dia.aberto ? 'text-brand-800' : 'text-gray-300'}`}>{dia.nome.slice(0,3)}</span>
                                        </div>
                                        {dia.aberto ? (
                                            <div className="flex gap-2">
                                                <input type="time" value={dia.inicio} onChange={e => {const h=[...horarios];h[idx].inicio=e.target.value;setHorarios(h)}} className="bg-brand-50 rounded-lg px-2 py-1 text-[10px] font-bold text-brand-700 outline-none w-16 text-center"/>
                                                <span className="text-brand-300 text-xs self-center">-</span>
                                                <input type="time" value={dia.fim} onChange={e => {const h=[...horarios];h[idx].fim=e.target.value;setHorarios(h)}} className="bg-brand-50 rounded-lg px-2 py-1 text-[10px] font-bold text-brand-700 outline-none w-16 text-center"/>
                                            </div>
                                        ) : <span className="text-[10px] text-gray-300 italic px-4">Fechado</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Botão Salvar Geral - Brand 900 para contraste máximo */}
                        <button onClick={salvarConfiguracoes} disabled={salvandoConfig} className="w-full bg-brand-900 text-white font-bold py-4 rounded-[1.5rem] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-brand-800">
                            {salvandoConfig ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Salvar Tudo</>}
                        </button>
                    </div>
                )}
            </main>

            <ProductModal isOpen={modalProdutoAberto} onClose={() => setModalProdutoAberto(false)} onSubmit={handleSalvarProduto} loading={salvandoProduto} isEditing={!!editandoProdutoId} nome={novoNome} setNome={setNovoNome} preco={novoPreco} setPreco={setNovoPreco} categoria={novaCategoria} setCategoria={setNovaCategoria} imagem={imagemBase64} onImageUpload={handleImagemProduto} />
            <DeleteModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmarExclusao} />
        </div>
    );
}