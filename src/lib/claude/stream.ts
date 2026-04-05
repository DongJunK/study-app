import { spawn } from 'child_process';

const CHAR_DELAY_MS = 15; // 글자당 딜레이 (ms)
const CHUNK_SIZE = 3; // 한번에 보낼 글자 수

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createClaudeStream(
  prompt: string,
  systemPrompt?: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--include-partial-messages'];
      if (systemPrompt) args.push('--append-system-prompt', systemPrompt);
      args.push('--allowedTools', 'Read');

      const proc = spawn('claude', args);
      let buffer = '';

      // Queue for smoothing output
      const textQueue: string[] = [];
      let flushing = false;
      let closed = false;

      async function flushQueue() {
        if (flushing) return;
        flushing = true;

        while (textQueue.length > 0 && !closed) {
          const text = textQueue.shift()!;

          // Split into small chunks for smooth rendering
          for (let i = 0; i < text.length; i += CHUNK_SIZE) {
            if (closed) break;
            const chunk = text.slice(i, i + CHUNK_SIZE);
            const sseData = `data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`;
            try {
              controller.enqueue(encoder.encode(sseData));
            } catch {
              closed = true;
              break;
            }
            if (i + CHUNK_SIZE < text.length) {
              await sleep(CHAR_DELAY_MS);
            }
          }
        }

        flushing = false;
      }

      proc.stdout.on('data', (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (
              event.type === 'stream_event' &&
              event.event?.delta?.type === 'text_delta' &&
              event.event.delta.text
            ) {
              textQueue.push(event.event.delta.text);
              flushQueue();
            }

            if (event.type === 'result' && event.result) {
              // Wait for queue to drain before sending done
              const waitAndSendDone = async () => {
                while (textQueue.length > 0 || flushing) {
                  await sleep(50);
                }
                if (!closed) {
                  const sseData = `data: ${JSON.stringify({ type: 'done', content: event.result })}\n\n`;
                  try {
                    controller.enqueue(encoder.encode(sseData));
                  } catch { /* closed */ }
                }
              };
              waitAndSendDone();
            }
          } catch {
            // Non-JSON line, skip
          }
        }
      });

      proc.stderr.on('data', (data: Buffer) => {
        if (!closed) {
          const errorMsg = `data: ${JSON.stringify({ type: 'error', content: data.toString() })}\n\n`;
          try { controller.enqueue(encoder.encode(errorMsg)); } catch { /* closed */ }
        }
      });

      proc.on('close', async () => {
        // Wait for queue to fully drain
        while (textQueue.length > 0 || flushing) {
          await sleep(50);
        }
        if (!closed) {
          closed = true;
          const endMsg = `data: [DONE]\n\n`;
          try {
            controller.enqueue(encoder.encode(endMsg));
            controller.close();
          } catch { /* already closed */ }
        }
      });

      proc.on('error', (err) => {
        if (!closed) {
          closed = true;
          const errorMsg = `data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`;
          try {
            controller.enqueue(encoder.encode(errorMsg));
            controller.close();
          } catch { /* already closed */ }
        }
      });
    },
  });
}
