import sendRequest, { encodeForm } from './api';


class UserLoggedOutError extends Error {
    constructor(message = "Please log in again to continue.") {
        super(message);
        this.name = 'UserLoggedOutError';
    }
}


// Whether a logout has been triggered:
let isLoggingOut = false;

// Whether a token refresh is running:
let refreshing = null;


export async function getTokens(forceRefresh = false) {
    try {
        // TODO: Consider not storing in LocalStorage:
        let tokens = JSON.parse(localStorage.getItem('tokens'));
        if (!tokens) return null;
        
        const now = Date.now();
        const accessTokenExpiry = new Date(tokens.access_token_expiry).getTime();
        const refreshTokenExpiry = new Date(tokens.refresh_token_expiry).getTime();

        // If the access token has expired or force refresh is requested:
        if (forceRefresh || accessTokenExpiry < now) {
            // If the refresh token has also expired, logging out:
            if (refreshTokenExpiry < now) {
                throw new UserLoggedOutError();
            }

            // If a refresh is not already running, triggering refresh:
            if (!refreshing) {
                refreshing = refreshToken();
            }

            // Waiting for the refresh to complete:
            const refreshSuccessful = await refreshing;
            
            // Clear refreshing state
            refreshing = null;

            // If the refresh failed, logging out:
            if (!refreshSuccessful) {
                throw new UserLoggedOutError();
            }

            tokens = JSON.parse(localStorage.getItem('tokens'));
        }

        return tokens;
    } catch (error) {
        if (error instanceof UserLoggedOutError) {
            logout();
        }
        throw error;
    }
}

function setTokens(newTokens) {
    const current = JSON.parse(localStorage.getItem('tokens')) || {};
    localStorage.setItem('tokens', JSON.stringify({ ...current, ...newTokens }));
}


export async function login(email, password) {
    const tokens = await sendRequest('/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeForm({ username: email, password }),
    }, false);

    // If the login was successful, storing the tokens:
    if (tokens?.access_token) {
        setTokens(tokens);
    }


    return tokens;
}


async function refreshToken() {
    try {
        const tokens = JSON.parse(localStorage.getItem('tokens'));
        if (!tokens?.refresh_token) {
            throw new UserLoggedOutError();
        }

        const response = await sendRequest('/auth/token/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: tokens.refresh_token }),
        }, false);

        if (!response?.access_token) {
            throw new UserLoggedOutError();
        }
        
        setTokens(response);
        return true;
    } catch (error) {
        console.error("Token refresh failed:", error);
        return false;
    }
}


export async function userLoggedIn() {
    return await getTokens();
}


export function logout() {
    if (!isLoggingOut) {
        isLoggingOut = true;
        localStorage.removeItem('tokens');
        window.location.reload();
    }
}

  