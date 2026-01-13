import { ProviderError } from '../providers/provider';

export function getSafeHostFromBaseUrl(baseUrl: string): string {
    try {
        const url = new URL(baseUrl);
        return url.host || baseUrl;
    } catch {
        return baseUrl;
    }
}

export function formatProviderErrorMessage(error: unknown, baseUrl: string): { userMessage: string; logMessage: string } {
    const host = getSafeHostFromBaseUrl(baseUrl);
    const truncate = (s: string, max = 800) => (s.length > max ? s.slice(0, max) + '…' : s);

    if (error instanceof ProviderError) {
        const status = error.statusCode;
        const base = `Request failed${status ? ` (HTTP ${status})` : ''}.`;

        if (!status) {
            return {
                userMessage: `${base} Check your endpoint settings.`,
                logMessage: `${base} host=${host} err=${truncate(error.message)}`
            };
        }

        if (status === 401 || status === 403) {
            return {
                userMessage: `${base} Unauthorized. Check API key and permissions.`,
                logMessage: `HTTP ${status} host=${host} err=${truncate(error.message)}`
            };
        }

        if (status === 404) {
            return {
                userMessage: `${base} Not Found. Check baseUrl (it should usually include \`/v1\`) and confirm the server exposes \`/chat/completions\`.`,
                logMessage: `HTTP 404 host=${host} err=${truncate(error.message)}`
            };
        }

        if (status === 429) {
            return {
                userMessage: `${base} Rate limited. Try again later or reduce request frequency.`,
                logMessage: `HTTP 429 host=${host} err=${truncate(error.message)}`
            };
        }

        if (status >= 500 && status <= 599) {
            return {
                userMessage: `${base} Server error. Retry later or check provider status.`,
                logMessage: `HTTP ${status} host=${host} err=${truncate(error.message)}`
            };
        }

        return {
            userMessage: `${base} Check your endpoint configuration.`,
            logMessage: `HTTP ${status} host=${host} err=${truncate(error.message)}`
        };
    }

    const message = error instanceof Error ? error.message : String(error);
    const isAbort = error instanceof Error && (error.name === 'AbortError' || message.toLowerCase().includes('aborted'));

    if (isAbort) {
        return {
            userMessage: 'Request cancelled.',
            logMessage: `aborted host=${host}`
        };
    }

    return {
        userMessage: `Request failed. Check network connectivity and baseUrl (host: ${host}).`,
        logMessage: `unknown host=${host} err=${truncate(message)}`
    };
}
