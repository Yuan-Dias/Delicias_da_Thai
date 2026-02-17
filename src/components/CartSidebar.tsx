import { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag, MapPin, Store, ArrowRight, Truck, User, Trash2, AlertCircle, Calendar, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { collection, getDocs, query, orderBy, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

// --- SEU COMPONENTE DE TOAST (Integrado aqui ou importado) ---
function ToastContainer({ toasts }: { toasts: { id: number; message: string; type: 'success' | 'error' }[] }) {
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

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TaxaEntrega {
    id: string;
    bairro: string;
    valor: number;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
    const {
        items,
        adicionarItem,
        removerItem,
        total,
        entregaAtiva,
        setEntregaAtiva,
        modoEntrega,
        setModoEntrega,
        dadosCliente,
        atualizarDadosCliente,
        limparCarrinho,
    } = useCartStore();

    const [listaBairros, setListaBairros] = useState<TaxaEntrega[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(true);

    // --- ESTADO PARA OS TOASTS ---
    const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

    const addToast = (message: string, type: 'success' | 'error') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    // VERIFICA SE TEM ENCOMENDA NO CARRINHO
    const temItemEncomenda = items.some(item => item.categoria === 'encomenda' || item.disponivel === false);
    const ehPedidoAgendado = temItemEncomenda || !!dadosCliente.dataAgendamento;
    const mostrarFormEntrega = modoEntrega === 'entrega' && entregaAtiva;

    // Data mínima (Agora) para o atributo 'min' do input
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    const minDate = agora.toISOString().slice(0, 16);

    const [lojaAbertaNoPainel, setLojaAbertaNoPainel] = useState(false);
    const [horariosConfig, setHorariosConfig] = useState<any[]>([]);

    const verificarLojaAberta = () => {
        if (!lojaAbertaNoPainel) return false; // Fechado no interruptor manual
        if (horariosConfig.length === 0) return true; // Se não houver horários, confia no manual

        const agora = new Date();
        const diaSemana = agora.getDay(); // 0-6
        const horaAtual = agora.getHours() * 60 + agora.getMinutes();

        // Encontra a regra para hoje (no Dashboard o Domingo é ID '0')
        const hoje = horariosConfig.find(h => parseInt(h.id) === diaSemana);

        if (!hoje || !hoje.aberto || !hoje.inicio || !hoje.fim) return false;

        const [hInicio, mInicio] = hoje.inicio.split(':').map(Number);
        const [hFim, mFim] = hoje.fim.split(':').map(Number);

        const minutosInicio = hInicio * 60 + mInicio;
        const minutosFim = hFim * 60 + mFim;

        return horaAtual >= minutosInicio && horaAtual <= minutosFim;
    };

    const abertaAgora = verificarLojaAberta();

    useEffect(() => {
        if (isOpen) {
            const carregarBairros = async () => {
                try {
                    const q = query(collection(db, "taxas_entrega"), orderBy("bairro"));
                    const snapBairros = await getDocs(q);
                    setListaBairros(snapBairros.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TaxaEntrega[]);
                } catch (e) {
                    console.error("Erro ao carregar bairros:", e);
                }
            };
            carregarBairros();

            const unsubStatus = onSnapshot(doc(db, "config", "status_loja"), (snap) => {
                if (snap.exists()) {
                    setLojaAbertaNoPainel(snap.data().aberta);
                }
            });

            const unsubConfig = onSnapshot(doc(db, "config", "loja"), (docConfig) => {
                setLoadingConfig(false);
                if (docConfig.exists()) {
                    const dados = docConfig.data();

                    const podeEntregar = dados.entregaAtiva !== undefined ? dados.entregaAtiva : true;
                    setEntregaAtiva(podeEntregar);

                    if (dados.horarios) {
                        setHorariosConfig(dados.horarios);
                    }
                }
            }, (error) => {
                console.error("Erro ao ouvir config:", error);
                setLoadingConfig(false);
            });

            return () => {
                unsubStatus();
                unsubConfig();
            };
        }
    }, [isOpen, setEntregaAtiva]);

    const subtotal = items.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    const totalFinal = total();

    const formatarDataBr = (dataString: string) => {
        if (!dataString) return "";
        const date = new Date(dataString);
        return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const finalizarPedido = () => {
        const telefoneLoja = "5573981943221";
        const temItemEncomenda = items.some(item => item.categoria === 'encomenda');

        if (!dadosCliente.nome.trim()) {
            return addToast("Por favor, digite seu nome.", "error");
        }

        if (modoEntrega === 'entrega') {
            if (!entregaAtiva) return addToast("Entrega indisponível no momento.", "error");
            if (!dadosCliente.bairroId) return addToast("Selecione o bairro.", "error");
            if (!dadosCliente.endereco.trim()) return addToast("Digite o endereço.", "error");
        }

        if (dadosCliente.dataAgendamento) {
            const dataEscolhida = new Date(dadosCliente.dataAgendamento);
            const agoraCheck = new Date();
            if (dataEscolhida < agoraCheck) {
                return addToast("A data do agendamento deve ser futura.", "error");
            }
        } else if (temItemEncomenda) {
            return addToast("Selecione a Data e Hora para o pedido sob encomenda.", "error");
        }

        let msg = `*NOVO PEDIDO - DELÍCIAS DA THAI*\n`;
        msg += `==============================\n\n`;

        msg += `*CLIENTE:* ${dadosCliente.nome.toUpperCase()}\n`;
        msg += `*MÉTODO:* ${mostrarFormEntrega ? 'ENTREGA' : 'RETIRADA NA LOJA'}\n`;

        if (dadosCliente.dataAgendamento) {
            msg += `*AGENDADO PARA:* ${formatarDataBr(dadosCliente.dataAgendamento)}\n`;
        } else {
            msg += `*PEDIDO PARA:* AGORA (IMEDIATO)\n`;
        }

        msg += `\n------------------------------\n`;
        msg += `*ITENS DO PEDIDO:*\n`;

        items.forEach(item => {
            const ehEncomenda = item.categoria === 'encomenda' || item.disponivel === false;
            const tag = ehEncomenda ? '[ENCOMENDA]' : ' [PRONTA-ENTREGA]';

            msg += `> *${item.quantidade}x ${item.nome}*\n`;
            msg += `  ${tag} - R$ ${(item.preco * item.quantidade).toFixed(2)}\n\n`;
        });

        msg += `------------------------------\n`;
        msg += `*Subtotal:* R$ ${subtotal.toFixed(2)}\n`;

        if (mostrarFormEntrega) {
            msg += `*Taxa de Entrega:* R$ ${dadosCliente.taxaEntrega.toFixed(2)}\n`;
            msg += `*Bairro:* ${dadosCliente.bairroNome}\n`;
            msg += `*Endereço:* ${dadosCliente.endereco}\n`;
        }

        if (dadosCliente.observacao) {
            msg += `\n*OBSERVAÇÕES:* ${dadosCliente.observacao}\n`;
        }

        msg += `\n*TOTAL A PAGAR: R$ ${totalFinal.toFixed(2)}*\n`;
        msg += `==============================\n`;
        msg += `_Aguardo a confirmação do pedido!_`;

        const link = `https://wa.me/${telefoneLoja}?text=${encodeURIComponent(msg)}`;
        window.open(link, '_blank');

        addToast("Pedido enviado! Redirecionando para o WhatsApp...", "success");

        setTimeout(() => {
            onClose(); // Fecha a barra lateral

            limparCarrinho();
        }, 1000);
    };

    return (
        <>
            {/* COMPONENTE DE TOAST RENDERIZADO AQUI */}
            <ToastContainer toasts={toasts} />

            <div
                className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <div className={`fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-gray-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                <div className="bg-white px-5 py-4 flex items-center justify-between shadow-sm border-b border-gray-100 z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-50 text-brand-600 p-2 rounded-lg"><ShoppingBag size={20} /></div>
                        <h2 className="text-lg font-bold text-gray-800">Seu Pedido</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={22} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 mt-10">
                            <ShoppingBag size={48} className="mb-3 text-gray-300" />
                            <p className="text-gray-500">Sua sacola está vazia.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* LISTA DE ITENS */}
                            {items.map((item) => (
                                <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center">
                                    {item.imagem ? (
                                        <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                                            <img src={item.imagem} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                                            <ShoppingBag size={20} className="text-gray-300" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">
                                                {item.nome}
                                                {(item.categoria === 'encomenda' || item.disponivel === false) && (
                                                    <span className="ml-2 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                                        Encomenda
                                                    </span>
                                                )}
                                            </h3>
                                            <button onClick={() => removerItem(item.id)} className="text-gray-300 hover:text-red-400 p-1 -mr-2"><Trash2 size={16} /></button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-brand-600 font-bold text-sm">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                                            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                                <button onClick={() => item.quantidade > 1 ? adicionarItem({ ...item, quantidade: item.quantidade - 1 }) : removerItem(item.id)} className="p-1 px-2 text-brand-600 hover:bg-gray-100 rounded-l-lg"><Minus size={14} /></button>
                                                <span className="text-xs font-semibold w-4 text-center text-gray-700">{item.quantidade}</span>
                                                <button onClick={() => adicionarItem({ ...item, quantidade: item.quantidade + 1 })} className="p-1 px-2 text-brand-600 hover:bg-gray-100 rounded-r-lg"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {items.length > 0 && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dados do Pedido</h3>

                            <div className="flex bg-gray-100 p-1 rounded-lg relative">
                                <button
                                    onClick={() => setModoEntrega('retirada')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all z-10 ${modoEntrega === 'retirada' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
                                >
                                    <Store size={16} /> Retirada
                                </button>

                                <button
                                    onClick={() => setModoEntrega('entrega')}
                                    disabled={!entregaAtiva || loadingConfig}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all z-10 
                                        ${modoEntrega === 'entrega' && entregaAtiva ? 'bg-white text-brand-600 shadow-sm' : ''}
                                        ${(!entregaAtiva || loadingConfig) ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-500 hover:text-gray-700'}
                                    `}
                                >
                                    <Truck size={16} /> Entrega
                                </button>
                            </div>

                            {!entregaAtiva && !loadingConfig && (
                                <div className="bg-orange-50 text-orange-700 text-xs p-3 rounded-lg flex items-start gap-2 border border-orange-100">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5"/>
                                    <span>
                                        <strong>Entrega Indisponível:</strong><br/>
                                        No momento a loja está aceitando apenas pedidos para <strong>Retirada</strong>.
                                    </span>
                                </div>
                            )}

                            <div className="space-y-3">
                                {/* CAMPO NOME */}
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Seu Nome</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Digite seu nome"
                                            value={dadosCliente.nome}
                                            onChange={e => atualizarDadosCliente({ nome: e.target.value })}
                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-brand-400 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* CAMPO DATA */}
                                <div className={ehPedidoAgendado ? "p-3 bg-purple-50 border border-purple-100 rounded-xl" : ""}>
                                    <label className={`text-[10px] font-bold uppercase ml-1 flex items-center gap-1 ${ehPedidoAgendado ? 'text-purple-600' : 'text-gray-400'}`}>
                                        <Calendar size={12}/>
                                        {temItemEncomenda ? "Data da Encomenda (Obrigatório)" : "Agendar para quando? (Opcional)"}
                                    </label>

                                    <input
                                        type="datetime-local"
                                        min={minDate}
                                        value={dadosCliente.dataAgendamento}
                                        onChange={e => atualizarDadosCliente({ dataAgendamento: e.target.value })}
                                        className={`w-full p-2 bg-white border rounded-lg text-sm outline-none mt-1 ${
                                            ehPedidoAgendado
                                                ? 'border-purple-200 focus:ring-2 focus:ring-purple-200 text-purple-900'
                                                : 'border-gray-200 focus:border-brand-400 text-gray-700'
                                        }`}
                                    />

                                    {ehPedidoAgendado && (
                                        <p className="text-[10px] text-purple-500 mt-1 font-medium flex items-center gap-1">
                                            <AlertCircle size={10} />
                                            {temItemEncomenda
                                                ? "Você possui itens sob encomenda no carrinho."
                                                : "Seus itens de pronta entrega serão preparados para esta data."}
                                        </p>
                                    )}
                                </div>

                                {/* CAMPOS DE ENTREGA */}
                                {mostrarFormEntrega ? (
                                    <div className="animate-fade-in space-y-3 pt-2 border-t border-gray-100">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Bairro</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-brand-400 outline-none appearance-none cursor-pointer text-gray-700"
                                                    value={dadosCliente.bairroId}
                                                    onChange={(e) => {
                                                        const bairro = listaBairros.find(b => b.id === e.target.value);
                                                        if (bairro) {
                                                            atualizarDadosCliente({ bairroId: bairro.id, bairroNome: bairro.bairro, taxaEntrega: bairro.valor });
                                                        } else {
                                                            atualizarDadosCliente({ bairroId: '', bairroNome: '', taxaEntrega: 0 });
                                                        }
                                                    }}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {listaBairros.map(b => (
                                                        <option key={b.id} value={b.id}>{b.bairro} (+ R$ {b.valor.toFixed(2)})</option>
                                                    ))}
                                                </select>
                                                <MapPin className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Endereço Completo</label>
                                            <textarea
                                                placeholder="Rua, Número, Ponto de referência..."
                                                value={dadosCliente.endereco}
                                                onChange={e => atualizarDadosCliente({ endereco: e.target.value })}
                                                rows={2}
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-brand-400 outline-none resize-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 flex gap-3 items-start animate-fade-in">
                                        <Store className="text-brand-500 shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <p className="text-sm font-bold text-brand-800">Retirada na Loja</p>
                                            <p className="text-xs text-brand-600 mt-0.5">O endereço da loja será enviado no WhatsApp.</p>
                                        </div>
                                    </div>
                                )}

                                {/* CAMPO OBSERVAÇÃO */}
                                <div className="pt-2 border-t border-gray-100">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1">
                                        <MessageSquare size={12}/> Observações (Opcional)
                                    </label>
                                    <textarea
                                        placeholder="Ex: Retirar cebola, escrever 'Parabéns' no bolo, troco para 50..."
                                        value={dadosCliente.observacao}
                                        onChange={e => atualizarDadosCliente({ observacao: e.target.value })}
                                        rows={2}
                                        className="w-full p-3 mt-1 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-brand-400 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="bg-white border-t border-gray-100 p-5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                        <div className="flex justify-between items-end mb-4">
                            <div className="text-sm text-gray-500">
                                <p>Subtotal: R$ {subtotal.toFixed(2)}</p>
                                {mostrarFormEntrega && (
                                    <p className="text-brand-600 font-medium text-xs">
                                        + Entrega: {dadosCliente.taxaEntrega === 0 ? 'A combinar' : `R$ ${dadosCliente.taxaEntrega.toFixed(2)}`}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 font-bold uppercase">Total a pagar</p>
                                <p className="text-2xl font-bold text-gray-800 leading-none">R$ {totalFinal.toFixed(2)}</p>
                            </div>
                        </div>

                        <button
                            onClick={finalizarPedido}
                            disabled={!abertaAgora}
                            className={`w-full font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all 
                                ${abertaAgora
                                ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-100 active:scale-[0.98]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            {abertaAgora ? (
                                <>
                                    <span>Finalizar no WhatsApp</span>
                                    <ArrowRight size={18} />
                                </>
                            ) : (
                                <>
                                    <Clock size={18} />
                                    <span>Loja Fechada</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}