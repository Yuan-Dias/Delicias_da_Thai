import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ShoppingBag, Lock, Store, Plus, Search, Sparkles, Croissant, Cookie, Cake, MapPin , Clock, Settings} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCartStore } from '../../store/cartStore';
import { CartSidebar } from '../../components/CartSidebar';

interface Produto {
    id: string;
    nome: string;
    descricao?: string;
    preco: number;
    categoria: 'pronta-entrega' | 'encomenda';
    imagem: string;
    disponivel?: boolean;
}

export function Home() {
    // --- ESTADOS ---
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartOpen, setCartOpen] = useState(false);

    // Filtros
    const [termoBusca, setTermoBusca] = useState('');
    const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'pronta-entrega' | 'encomenda'>('todos');

    // Config Loja
    const [logoLoja, setLogoLoja] = useState('');
    const [enderecoLoja, setEnderecoLoja] = useState('');
    const [horarios, setHorarios] = useState<any[]>([]);
    const [statusManual, setStatusManual] = useState(true);

    const { adicionarItem, items } = useCartStore();
    const totalItens = items.reduce((acc, item) => acc + item.quantidade, 0);
    const valorTotal = items.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    const checarStatusReal = (statusManual: boolean, horarios: any[]) => {
        if (!statusManual) return false; // Se fechou no botão, está fechado.
        if (!horarios || horarios.length === 0) return statusManual;

        const agora = new Date();
        const diaSemana = agora.getDay(); // 0 = Domingo, 1 = Segunda...
        const horaMinutosAtual = agora.getHours() * 60 + agora.getMinutes();

        const configHoje = horarios.find(h => parseInt(h.id) === diaSemana);

        if (!configHoje || !configHoje.aberto) return false;

        const [hInicio, mInicio] = configHoje.inicio.split(':').map(Number);
        const [hFim, mFim] = configHoje.fim.split(':').map(Number);

        const minutosInicio = hInicio * 60 + mInicio;
        const minutosFim = hFim * 60 + mFim;

        return horaMinutosAtual >= minutosInicio && horaMinutosAtual <= minutosFim;
    };

    // --- EFEITOS ---
    useEffect(() => {
        const unsubConfig = onSnapshot(doc(db, "config", "loja"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.logo) setLogoLoja(data.logo);
                if (data.endereco) setEnderecoLoja(data.endereco);
                if (data.horarios) setHorarios(data.horarios);
            }
        });

        const unsubStatus = onSnapshot(doc(db, "config", "status_loja"), (docSnap) => {
            if (docSnap.exists()) {
                setStatusManual(docSnap.data().aberta);
            }
        });

        const q = query(collection(db, "produtos"), orderBy("nome"));
        const unsubProdutos = onSnapshot(q, (snapshot) => {
            const lista = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Produto[];
            setProdutos(lista);
            setLoading(false);
        });

        return () => {
            unsubConfig();
            unsubStatus();
            unsubProdutos();
        };
    }, []);

    const lojaRealmenteAberta = checarStatusReal(statusManual, horarios);

    const handleAdicionarProduto = (produto: Produto) => {
        if (!lojaRealmenteAberta) return;

        if (produto.categoria === 'pronta-entrega' && produto.disponivel === false) {
            adicionarItem({ ...produto, categoria: 'encomenda' });
            return;
        }

        adicionarItem(produto);
    };

    const produtosFiltrados = produtos.filter(p => {
        const matchNome = p.nome.toLowerCase().includes(termoBusca.toLowerCase());

        const categoriaEfetiva = (p.categoria === 'pronta-entrega' && p.disponivel === false)
            ? 'encomenda'
            : p.categoria;

        const matchCategoria = filtroAtivo === 'todos' ? true : categoriaEfetiva === filtroAtivo;

        return matchNome && matchCategoria;
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-32">

            {/* --- HEADER --- */}
            <header className="relative bg-brand-600 pb-12 pt-6 overflow-hidden rounded-b-[3rem] shadow-2xl shadow-brand-900/20">

                {/* BOTÃO ADMIN - Adicionado aqui */}
                <Link
                    to="/admin"
                    className="absolute top-6 right-6 z-50 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/10 text-white/70 hover:text-white transition-all shadow-lg"
                    title="Área Administrativa"
                >
                    <Settings size={18} />
                </Link>

                {/* BACKGROUND ICONS */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <Cookie className="absolute top-10 -left-6 text-brand-800 opacity-10 rotate-12" size={120} />
                    <Croissant className="absolute top-20 -right-8 text-brand-500 opacity-20 -rotate-12" size={140} />
                    <Cake className="absolute -bottom-10 left-10 text-brand-900 opacity-10 rotate-45" size={100} />
                    <Sparkles className="absolute top-4 right-10 text-white opacity-20 animate-pulse" size={24} />
                </div>

                <div className="max-w-md mx-auto px-6 relative z-10 flex flex-col items-center text-center">

                    {/* Status Pill */}
                    <div className={`mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm ${lojaRealmenteAberta ? 'bg-emerald-500/20 text-emerald-50' : 'bg-red-500/20 text-red-50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${lojaRealmenteAberta ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                        <span className="text-[10px] font-bold tracking-widest uppercase">{lojaRealmenteAberta ? 'Loja Aberta' : 'Fechado'}</span>
                    </div>

                    {/* Logo & Título */}
                    <div className="flex flex-col items-center gap-3 mb-6">
                        <div className="p-1 bg-white/20 rounded-full backdrop-blur-sm">
                            <div className="bg-white p-1 rounded-full shadow-lg">
                                {logoLoja ? (
                                    <img src={logoLoja} alt="Logo" className="w-20 h-20 rounded-full object-cover border-2 border-brand-100" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center text-brand-400">
                                        <Store size={32} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-white">
                            <span className="block text-xs font-bold tracking-[0.2em] opacity-90 uppercase mb-1">Delícias da</span>
                            <h1 className="font-script text-5xl text-brand-50 drop-shadow-md rotate-[-2deg]">
                                Thai
                            </h1>

                            {/* --- EXIBIÇÃO DO ENDEREÇO --- */}
                            {enderecoLoja && (
                                <div className="mt-3 flex items-center justify-center gap-2 text-brand-100 bg-white/10 px-4 py-1.5 rounded-xl backdrop-blur-sm border border-white/5 mx-auto max-w-[280px]">
                                    <MapPin size={14} className="shrink-0" />
                                    <p className="text-[11px] font-medium leading-tight text-left line-clamp-2">{enderecoLoja}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Barra de Busca */}
                    <div className="w-full relative group transform transition-all focus-within:scale-105">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-400">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Qual desejo vamos realizar hoje?"
                            value={termoBusca}
                            onChange={(e) => setTermoBusca(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-white shadow-xl shadow-brand-900/10 rounded-2xl border-none outline-none text-gray-700 placeholder:text-gray-400 font-medium text-sm"
                        />
                    </div>
                </div>
            </header>

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <main className="max-w-4xl mx-auto px-4 -mt-6 relative z-20">

                {/* FILTROS */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex bg-white p-1.5 rounded-[1.5rem] shadow-xl shadow-brand-900/10 border border-brand-50">
                        {[
                            { id: 'todos', label: 'Tudo' },
                            { id: 'pronta-entrega', label: 'Pronta Entrega' },
                            { id: 'encomenda', label: 'Encomendas' }
                        ].map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setFiltroAtivo(cat.id as any)}
                                className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold transition-all duration-300
                                    ${filtroAtivo === cat.id
                                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                                    : 'text-gray-500 hover:text-brand-600 hover:bg-brand-50'}`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {!lojaRealmenteAberta && (
                    <div className="mb-6 mx-auto max-w-sm bg-white border border-red-100 p-4 rounded-2xl shadow-sm flex flex-col items-center text-center gap-2 animate-fade-in-up">
                        <div className="bg-red-50 p-3 rounded-full text-red-500"><Lock size={20}/></div>
                        <div>
                            <h3 className="font-bold text-gray-800">Loja Fechada</h3>
                            <p className="text-xs text-gray-500">Volte amanhã para fazer seu pedido!</p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20 text-brand-300"><span className="loader"></span></div>
                ) : produtosFiltrados.length === 0 ? (
                    <div className="text-center py-16 opacity-60">
                        <p className="font-script text-2xl text-gray-400">Nenhuma doçura encontrada...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
                        {produtosFiltrados.map((produto) => {
                            // Definimos se ele deve ser tratado visualmente como encomenda
                            const tratarComoEncomenda = produto.categoria === 'encomenda' || produto.disponivel === false;

                            return (
                                <div key={produto.id} className={`group bg-white p-2.5 md:p-3 rounded-[1.8rem] shadow-sm hover:shadow-xl hover:shadow-brand-100/50 transition-all duration-300 flex flex-col ${!lojaRealmenteAberta ? 'opacity-60 grayscale' : ''}`}>

                                    <div className="relative mb-3 overflow-hidden rounded-[1.3rem] aspect-square bg-gray-50">
                                        <img
                                            src={produto.imagem}
                                            alt={produto.nome}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                            loading="lazy"
                                        />

                                        {/* SELO ÚNICO DE ENCOMENDA */}
                                        {tratarComoEncomenda && (
                                            <span className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] font-bold text-center py-1 backdrop-blur-sm tracking-widest">
                                                SOB ENCOMENDA
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col flex-1 px-1">
                                        <h3 className="font-bold text-gray-700 text-sm leading-tight mb-1 line-clamp-2 min-h-[2.5em]">
                                            {produto.nome}
                                        </h3>

                                        {produto.descricao && (
                                            <p className="text-[10px] text-gray-400 leading-snug line-clamp-2 mb-2 italic">
                                                {produto.descricao}
                                            </p>
                                        )}

                                        <div className="mt-auto pt-2 flex items-center justify-between">
                                            <span className="text-brand-600 font-extrabold text-lg">
                                                {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>

                                            <button
                                                onClick={() => handleAdicionarProduto(produto)}
                                                disabled={!lojaRealmenteAberta}
                                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90
                                                ${!lojaRealmenteAberta
                                                    ? 'bg-gray-100 text-gray-300'
                                                    : tratarComoEncomenda
                                                        ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                                        : 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600'
                                                }`}
                                            >
                                                {!lojaRealmenteAberta ? (
                                                    <Lock size={14} />
                                                ) : tratarComoEncomenda ? (
                                                    <Clock size={18} strokeWidth={3} />
                                                ) : (
                                                    <Plus size={18} strokeWidth={3} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* BOTTOM BAR */}
            {totalItens > 0 && (
                <div className="fixed bottom-6 left-0 right-0 z-50 px-4 animate-fade-in-up">
                    <button
                        onClick={() => setCartOpen(true)}
                        className="w-full max-w-md mx-auto bg-gray-900 text-white p-2 pr-4 rounded-[1.5rem] shadow-2xl shadow-brand-900/40 flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer border border-white/10"
                    >
                        <div className="flex items-center gap-3 bg-white/10 pl-2 pr-4 py-1.5 rounded-2xl">
                            <span className="bg-brand-500 text-white w-9 h-9 flex items-center justify-center rounded-xl font-bold text-sm shadow-inner border border-white/20">
                                {totalItens}
                            </span>
                            <div className="flex flex-col text-left">
                                <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">Total</span>
                                <span className="font-bold text-base leading-none">
                                    {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm tracking-wide">Minha Sacola</span>
                            <ShoppingBag size={18} className="text-brand-300" />
                        </div>
                    </button>
                </div>
            )}

            <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        </div>
    );
}