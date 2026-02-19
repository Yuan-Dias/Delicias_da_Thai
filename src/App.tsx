import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';

// Importações das páginas
import { Home } from './pages/client/Home';
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';

// --- O SEGURANÇA DA PORTA (Rota Privada) ---
function RotaPrivada({ children }: { children: React.ReactNode }) {
    const [carregando, setCarregando] = useState(true);
    const [autenticado, setAutenticado] = useState(false);

    useEffect(() => {
        // O Firebase avisa se tem alguém logado ou não
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setAutenticado(true);
            } else {
                setAutenticado(false);
            }
            setCarregando(false);
        });

        return () => unsubscribe();
    }, []);

    if (carregando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
                Verificando acesso...
            </div>
        );
    }

    if (!autenticado) {
        return <Navigate to="/" replace />;
    }

    return children;
}

// --- ROTAS DO APP ---
function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rota Pública (Qualquer um acessa) */}
                <Route path="/" element={<Home />} />

                {/* Rota de Login (Qualquer um acessa, mas só loga quem tem permissão) */}
                <Route path="/admin" element={<Login />} />

                {/* Rota Privada (O Segurança tá na porta) */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <RotaPrivada>
                            <Dashboard />
                        </RotaPrivada>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;