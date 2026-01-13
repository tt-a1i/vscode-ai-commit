export async function readOpenAICompatibleStream(
    body: ReadableStream<Uint8Array>,
    onToken: (text: string) => void,
    signal?: AbortSignal
): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    let result = '';

    const push = (text: string) => {
        if (!text) return;
        result += text;
        onToken(text);
    };

    while (true) {
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by a blank line. Each event can have multiple "data:" lines.
        let sepIndex: number;
        while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
            const event = buffer.slice(0, sepIndex);
            buffer = buffer.slice(sepIndex + 2);

            const lines = event.split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;

                const payload = trimmed.slice(5).trim();
                if (!payload) continue;
                if (payload === '[DONE]') return result;

                try {
                    const json = JSON.parse(payload) as any;
                    const delta =
                        json?.choices?.[0]?.delta?.content ??
                        json?.choices?.[0]?.message?.content ??
                        json?.choices?.[0]?.text ??
                        '';
                    if (typeof delta === 'string') {
                        push(delta);
                    }
                } catch {
                    // ignore malformed chunks
                }
            }
        }
    }

    return result;
}

