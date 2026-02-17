import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/client/Home';
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard'; // <--- Importe aqui

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={<Login />} />
                <Route path="/admin/dashboard" element={<Dashboard />} /> {/* <--- Rota nova */}
            </Routes>
        </BrowserRouter>
    );
}

export default App;