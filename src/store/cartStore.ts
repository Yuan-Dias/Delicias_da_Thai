import { create } from 'zustand';

export interface Produto {
    id: string;
    nome: string;
    preco: number;
    imagem: string;
    categoria?: string; // Importante: vamos usar isso para verificar se é encomenda
    descricao?: string;
    disponivel?: boolean;
}

export interface ItemCarrinho extends Produto {
    quantidade: number;
}

interface DadosCliente {
    nome: string;
    telefone: string;
    endereco: string;
    bairroId: string;
    bairroNome: string;
    taxaEntrega: number;
    observacao: string;
    dataAgendamento: string; // Para salvar a data/hora escolhida
}

interface CartStore {
    items: ItemCarrinho[];
    entregaAtiva: boolean;
    modoEntrega: 'retirada' | 'entrega';
    dadosCliente: DadosCliente;

    adicionarItem: (produto: Produto | ItemCarrinho) => void;
    removerItem: (id: string) => void;
    limparCarrinho: () => void;
    setEntregaAtiva: (ativa: boolean) => void;
    setModoEntrega: (modo: 'retirada' | 'entrega') => void;
    atualizarDadosCliente: (dados: Partial<DadosCliente>) => void;
    total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
    items: [],
    entregaAtiva: true,
    modoEntrega: 'retirada',
    dadosCliente: {
        nome: '',
        telefone: '',
        endereco: '',
        bairroId: '',
        bairroNome: '',
        taxaEntrega: 0,
        observacao: '',       // Inicializa vazio
        dataAgendamento: ''   // Inicializa vazio
    },

    adicionarItem: (produto) => {
        const items = get().items;
        const itemExistente = items.find((item) => item.id === produto.id);

        if (itemExistente) {
            const novaQuantidade = 'quantidade' in produto
                ? (produto as ItemCarrinho).quantidade
                : itemExistente.quantidade + 1;

            if (novaQuantidade <= 0) {
                set((state) => ({ items: state.items.filter((i) => i.id !== produto.id) }));
                return;
            }
            set((state) => ({
                items: state.items.map((item) =>
                    item.id === produto.id ? { ...item, quantidade: novaQuantidade } : item
                ),
            }));
        } else {
            if ('quantidade' in produto && (produto as ItemCarrinho).quantidade < 1) return;
            set((state) => ({ items: [...state.items, { ...produto, quantidade: 1 }] }));
        }
    },

    removerItem: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
    },

    limparCarrinho: () => set({
        items: [],
        modoEntrega: 'retirada',
        dadosCliente: {
            nome: '',
            telefone: '',
            endereco: '',
            bairroId: '',
            bairroNome: '',
            taxaEntrega: 0,
            observacao: '',
            dataAgendamento: ''
        }
    }),

    setEntregaAtiva: (ativa: boolean) => {
        set((state) => {
            if (!ativa) {
                return {
                    entregaAtiva: false,
                    modoEntrega: 'retirada',
                    dadosCliente: {
                        ...state.dadosCliente,
                        taxaEntrega: 0,
                        endereco: '',
                        bairroId: '',
                        bairroNome: ''
                    }
                };
            }
            return { entregaAtiva: true };
        });
    },

    setModoEntrega: (modo) => {
        const { entregaAtiva, dadosCliente } = get();

        if (modo === 'entrega' && !entregaAtiva) {
            return;
        }

        if (modo === 'retirada') {
            set({
                modoEntrega: 'retirada',
                dadosCliente: { ...dadosCliente, taxaEntrega: 0 }
            });
        } else {
            set({ modoEntrega: 'entrega' });
        }
    },

    atualizarDadosCliente: (dados) => {
        set((state) => ({
            dadosCliente: { ...state.dadosCliente, ...dados }
        }));
    },

    total: () => {
        const { items, modoEntrega, dadosCliente, entregaAtiva } = get();
        const subtotal = items.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
        const taxa = (modoEntrega === 'entrega' && entregaAtiva) ? dadosCliente.taxaEntrega : 0;
        return subtotal + taxa;
    }
}));