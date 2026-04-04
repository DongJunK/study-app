import { spawn } from 'child_process';

export interface ClaudeResponse {
  text: string;
  sessionId?: string;
}

export async function askClaude(
  prompt: string,
  systemPrompt?: string
): Promise<ClaudeResponse> {
  return new Promise((resolve, reject) => {
    const args = ['-p', prompt, '--output-format', 'json'];
    if (systemPrompt) args.push('--append-system-prompt', systemPrompt);
    args.push('--allowedTools', 'Read');

    const proc = spawn('claude', args);
    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(output);
          resolve({ text: parsed.result, sessionId: parsed.session_id });
        } catch {
          resolve({ text: output.trim() });
        }
      } else {
        reject(
          new Error(
            `Claude process exited with code ${code}: ${errorOutput || output}`
          )
        );
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn claude process: ${err.message}`));
    });
  });
}

export async function* streamClaude(
  prompt: string,
  systemPrompt?: string
): AsyncGenerator<string> {
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--include-partial-messages'];
  if (systemPrompt) args.push('--append-system-prompt', systemPrompt);
  args.push('--allowedTools', 'Read');

  const proc = spawn('claude', args);
  let buffer = '';

  const iterator = createAsyncIterator(proc);

  for await (const chunk of iterator) {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        // Handle streaming text deltas
        if (
          event.type === 'stream_event' &&
          event.event?.delta?.type === 'text_delta' &&
          event.event.delta.text
        ) {
          yield event.event.delta.text;
        } else if (event.type === 'result' && event.result) {
          yield event.result;
        }
      } catch {
        // Non-JSON line, skip
      }
    }
  }
}

function createAsyncIterator(
  proc: ReturnType<typeof spawn>
): AsyncIterable<string> {
  return {
    [Symbol.asyncIterator]() {
      const chunks: string[] = [];
      let resolve: ((value: IteratorResult<string>) => void) | null = null;
      let done = false;

      proc.stdout?.on('data', (data: Buffer) => {
        const str = data.toString();
        if (resolve) {
          const r = resolve;
          resolve = null;
          r({ value: str, done: false });
        } else {
          chunks.push(str);
        }
      });

      proc.on('close', () => {
        done = true;
        if (resolve) {
          const r = resolve;
          resolve = null;
          r({ value: '', done: true });
        }
      });

      return {
        next(): Promise<IteratorResult<string>> {
          if (chunks.length > 0) {
            return Promise.resolve({
              value: chunks.shift()!,
              done: false,
            });
          }
          if (done) {
            return Promise.resolve({ value: '', done: true });
          }
          return new Promise((r) => {
            resolve = r;
          });
        },
      };
    },
  };
}
