import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase'; // Importa a conexão que configuramos

export function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);

    const navigate = useNavigate(); // Hook para mudar de página

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault(); // Evita recarregar a página
        setErro('');
        setCarregando(true);

        try {
            // Tenta fazer login no Firebase
            await signInWithEmailAndPassword(auth, email, senha);

            // Se der certo, vai para o Dashboard
            navigate('/admin/dashboard');
        } catch (error) {
            // Se der errado
            console.error(error);
            setErro("Email ou senha incorretos.");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
                <div className="bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="text-brand-600" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Área Restrita</h1>
                <p className="text-gray-500 mb-6">Acesso exclusivo da Thai</p>

                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Seu email"
                        className="w-full p-3 border border-gray-200 rounded-lg mb-3 focus:outline-none focus:border-brand-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Sua senha"
                        className="w-full p-3 border border-gray-200 rounded-lg mb-6 focus:outline-none focus:border-brand-500"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                    />

                    {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

                    <button
                        disabled={carregando}
                        type="submit"
                        className="w-full bg-brand-500 text-white py-3 rounded-lg font-bold hover:bg-brand-600 transition-colors flex justify-center items-center disabled:opacity-70"
                    >
                        {carregando ? <Loader2 className="animate-spin" /> : "Entrar no Painel"}
                    </button>
                </form>
            </div>
        </div>
    );
}