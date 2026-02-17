import { useState } from 'react';
import { Lock, Loader2, Mail } from 'lucide-react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';

export function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);

    const navigate = useNavigate();

    // --- LOGIN COM GOOGLE ---
    const handleLoginGoogle = async () => {
        setCarregando(true);
        setErro('');

        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const emailsPermitidos = [
                'yuanbdias692@gmail.com',
                'thaisoliveiraguimaraes6@gmail.com'
            ];

            if (!emailsPermitidos.includes(user.email || '')) {
                await auth.signOut();
                setErro('Este e-mail Google não tem permissão de administrador.');
                setCarregando(false);
                return;
            }

            navigate('/admin/dashboard');

        } catch (error: any) {
            console.error(error);
            setErro('Erro ao entrar com Google. Tente novamente.');
            setCarregando(false);
        }
    };

    // --- LOGIN COM E-MAIL E SENHA ---
    const handleLoginEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setCarregando(true);
        setErro('');

        try {
            await signInWithEmailAndPassword(auth, email, senha);
            navigate('/admin/dashboard');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/invalid-credential') {
                setErro('E-mail ou senha incorretos.');
            } else {
                setErro('Ocorreu um erro ao tentar entrar.');
            }
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-600 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">

                {/* Ícone do Topo */}
                <div className="bg-brand-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Lock className="text-brand-600" size={32} />
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-1">Área da Thai</h1>
                <p className="text-gray-400 text-sm mb-8">Gerencie suas encomendas</p>

                {/* Botão Google */}
                <button
                    onClick={handleLoginGoogle}
                    disabled={carregando}
                    className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm mb-6"
                >
                    {carregando ? (
                        <Loader2 className="animate-spin text-gray-400" size={20} />
                    ) : (
                        <>
                            {/* Logo do Google SVG */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Entrar com Google
                        </>
                    )}
                </button>

                {/* Divisor */}
                <div className="relative flex py-2 items-center mb-6">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wider">Ou via e-mail</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                </div>

                {/* Formulário de Email */}
                <form onSubmit={handleLoginEmail} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="email"
                            placeholder="Seu email"
                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 transition-colors text-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="password"
                            placeholder="Sua senha"
                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 transition-colors text-sm"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                        />
                    </div>

                    {erro && (
                        <div className="p-3 bg-red-50 text-red-500 text-xs rounded-lg text-left">
                            {erro}
                        </div>
                    )}

                    <button
                        disabled={carregando}
                        type="submit"
                        className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 active:scale-[0.98] transition-all flex justify-center items-center shadow-lg shadow-brand-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {carregando ? <Loader2 className="animate-spin" /> : "Acessar Painel"}
                    </button>
                </form>
            </div>
        </div>
    );
}
