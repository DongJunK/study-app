import { spawn } from 'child_process';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createClaudeStream(
  prompt: string,
  systemPrompt?: string,
  allowedTools?: string[]
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose'];
      if (systemPrompt) args.push('--append-system-prompt', systemPrompt);
      const tools = allowedTools || ['Read'];
      args.push('--allowedTools', tools.join(','));

      const proc = spawn('claude', args);
      let buffer = '';
      let closed = false;

      function send(data: string) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          closed = true;
        }
      }

      proc.stdout.on('data', (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            // stream_event with text_delta (available with or without --include-partial-messages)
            if (
              event.type === 'stream_event' &&
              event.event?.delta?.type === 'text_delta' &&
              event.event.delta.text
            ) {
              send(`data: ${JSON.stringify({ type: 'text', content: event.event.delta.text })}\n\n`);
            }

            // result event — extract final text and send as done
            if (event.type === 'result' && event.result) {
              let finalText = '';
              const result = event.result;

              // Extract text from result object
              if (typeof result === 'string') {
                finalText = result;
              } else if (result.content) {
                // result.content can be a string or array of content blocks
                if (typeof result.content === 'string') {
                  finalText = result.content;
                } else if (Array.isArray(result.content)) {
                  finalText = result.content
                    .filter((block: { type: string; text?: string }) => block.type === 'text' && block.text)
                    .map((block: { text: string }) => block.text)
                    .join('\n');
                }
              }

              if (finalText) {
                send(`data: ${JSON.stringify({ type: 'done', content: finalText })}\n\n`);
              }
            }
          } catch {
            // Non-JSON line, skip
          }
        }
      });

      proc.stderr.on('data', (data: Buffer) => {
        send(`data: ${JSON.stringify({ type: 'error', content: data.toString() })}\n\n`);
      });

      proc.on('close', () => {
        if (!closed) {
          closed = true;
          try {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch { /* already closed */ }
        }
      });

      proc.on('error', (err) => {
        if (!closed) {
          closed = true;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`));
            controller.close();
          } catch { /* already closed */ }
        }
      });
    },
  });
}
