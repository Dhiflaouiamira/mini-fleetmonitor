import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null); 
  };

  return token 
    ? <Dashboard onLogout={handleLogout} /> 
    : <Login onLogin={setToken} />;
}

export default App;
