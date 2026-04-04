import { spawn } from 'child_process';

export function createClaudeStream(
  prompt: string,
  systemPrompt?: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--include-partial-messages'];
      if (systemPrompt) args.push('--append-system-prompt', systemPrompt);
      args.push('--allowedTools', 'Read');

      const proc = spawn('claude', args);
      let buffer = '';

      proc.stdout.on('data', (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            // Handle streaming text deltas (real-time tokens)
            if (
              event.type === 'stream_event' &&
              event.event?.delta?.type === 'text_delta' &&
              event.event.delta.text
            ) {
              const sseData = `data: ${JSON.stringify({ type: 'text', content: event.event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }

            // Handle final result
            if (event.type === 'result' && event.result) {
              const sseData = `data: ${JSON.stringify({ type: 'done', content: event.result })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
          } catch {
            // Non-JSON line, skip
          }
        }
      });

      proc.stderr.on('data', (data: Buffer) => {
        const errorMsg = `data: ${JSON.stringify({ type: 'error', content: data.toString() })}\n\n`;
        controller.enqueue(encoder.encode(errorMsg));
      });

      proc.on('close', () => {
        const endMsg = `data: [DONE]\n\n`;
        controller.enqueue(encoder.encode(endMsg));
        controller.close();
      });

      proc.on('error', (err) => {
        const errorMsg = `data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`;
        controller.enqueue(encoder.encode(errorMsg));
        controller.close();
      });
    },
  });
}
