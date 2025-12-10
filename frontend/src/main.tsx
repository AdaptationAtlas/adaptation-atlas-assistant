import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from 'react-oidc-context';

function getRedirectUri(): string {
    if (import.meta.env.DEV) {
        return 'http://localhost:5173';
    }
    return import.meta.env.VITE_REDIRECT_URI || window.location.origin;
}

const cognitoAuthConfig = {
    authority: import.meta.env.VITE_COGNITO_AUTHORITY,
    client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'email openid phone',
    onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
    },
};

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider {...cognitoAuthConfig}>
            <App />
        </AuthProvider>
    </StrictMode>
);
