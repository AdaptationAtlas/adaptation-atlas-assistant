import { Chat } from './components/Chat';
import { Login } from './components/Login';
import { useAuth } from './api/hooks';
import './App.css';

function App() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh'
            }}>
                Loading...
            </div>
        );
    }

    return isAuthenticated ? <Chat /> : <Login />;
}

export default App;
