import { Chat } from './components/Chat';
import { Login } from './components/Login';
import { MapTest } from './components/MapTest';
import './App.css';
import { useAuth } from 'react-oidc-context';
import { apiClient } from './api';
import { useEffect } from 'react';

function App() {
    const { isAuthenticated, isLoading, user } = useAuth();

    useEffect(() => {
        if (user) {
            apiClient.setToken(user.access_token);
        } else {
            apiClient.clearToken();
        }
    }, [user]);

    // Check (temporary) flag in URL to display Test Map
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('test');

    if (testMode === 'map') {
        return <MapTest />;
    }

    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                }}
            >
                Loading...
            </div>
        );
    }

    return isAuthenticated ? <Chat /> : <Login />;
}

export default App;
