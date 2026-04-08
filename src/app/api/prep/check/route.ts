import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const tempDir = path.join(process.cwd(), 'data', 'temp');
    const entries = await fs.readdir(tempDir).catch(() => []);
    const mdFiles = (entries as string[]).filter((f: string) => f.endsWith('.md'));

    return Response.json({
      success: true,
      data: {
        available: mdFiles.length > 0,
        files: mdFiles,
      },
    });
  } catch {
    return Response.json({
      success: true,
      data: { available: false, files: [] },
    });
  }
}
