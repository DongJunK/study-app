import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

interface StatusResult {
  available: boolean;
  installed: boolean;
  authenticated: boolean;
  reason?: string;
}

function runCommand(command: string, args: string[], timeoutMs = 10000): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args);
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill();
      resolve({ code: null, stdout, stderr: 'timeout' });
    }, timeoutMs);

    proc.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({ code: null, stdout: '', stderr: err.message });
    });
  });
}

export async function GET() {
  const result: StatusResult = {
    available: false,
    installed: false,
    authenticated: false,
  };

  // Check 1: Is Claude CLI installed?
  const versionCheck = await runCommand('claude', ['--version'], 5000);
  if (versionCheck.code === null && versionCheck.stderr.includes('ENOENT')) {
    result.reason = 'Claude CLI가 설치되어 있지 않습니다. claude.ai/download 에서 Claude CLI를 설치해주세요.';
    return NextResponse.json({ success: true, data: result });
  }

  if (versionCheck.code !== 0) {
    result.reason = 'Claude CLI 실행에 실패했습니다. Claude CLI가 올바르게 설치되어 있는지 확인해주세요.';
    return NextResponse.json({ success: true, data: result });
  }

  result.installed = true;

  // Check 2: Is Claude CLI authenticated?
  // Try a minimal prompt to verify authentication
  const authCheck = await runCommand('claude', ['-p', 'ping', '--output-format', 'json', '--max-turns', '1'], 15000);

  if (authCheck.code !== 0) {
    const errorMsg = authCheck.stderr.toLowerCase() + authCheck.stdout.toLowerCase();
    if (errorMsg.includes('auth') || errorMsg.includes('login') || errorMsg.includes('token') || errorMsg.includes('sign in') || errorMsg.includes('credential') || errorMsg.includes('account')) {
      result.reason = 'Claude CLI에 로그인되어 있지 않습니다. 터미널에서 "claude login" 명령어를 실행하여 로그인해주세요.';
    } else if (errorMsg.includes('timeout')) {
      result.reason = 'Claude CLI 응답 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.';
    } else {
      result.reason = `Claude CLI 인증 확인에 실패했습니다. 터미널에서 "claude login" 명령어를 실행하여 로그인 상태를 확인해주세요. (${authCheck.stderr.trim() || authCheck.stdout.trim()})`;
    }
    return NextResponse.json({ success: true, data: result });
  }

  result.authenticated = true;
  result.available = true;

  return NextResponse.json({ success: true, data: result });
}
