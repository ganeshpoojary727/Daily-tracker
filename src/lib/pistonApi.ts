/**
 * Client service to execute Java code in a sandboxed runtime via Piston REST API.
 */

export interface JavaExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs?: number;
  error?: string;
}

const PISTON_ENDPOINT = 'https://emkc.org/api/v2/piston/execute';

export async function executeJavaCode(
  code: string,
  stdin: string = ''
): Promise<JavaExecutionResult> {
  const startTime = performance.now();

  if (!code.trim()) {
    return {
      success: false,
      stdout: '',
      stderr: 'Error: Cannot run empty code.',
      exitCode: 1,
      executionTimeMs: 0,
    };
  }

  try {
    const response = await fetch(PISTON_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'java',
        version: '15.0.2',
        files: [
          {
            name: 'Main.java',
            content: code,
          },
        ],
        stdin: stdin || '',
        run_timeout: 5000,
        compile_timeout: 10000,
      }),
    });

    const elapsed = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        stdout: '',
        stderr: `Server Error (${response.status}): ${errText || 'Failed to communicate with execution server.'}`,
        exitCode: response.status,
        executionTimeMs: elapsed,
      };
    }

    const data = await response.json();

    // Check if compile phase had an error
    if (data.compile && data.compile.code !== 0) {
      return {
        success: false,
        stdout: data.compile.stdout || '',
        stderr: data.compile.stderr || data.compile.output || 'Compilation failed.',
        exitCode: data.compile.code,
        executionTimeMs: elapsed,
      };
    }

    // Check run phase
    const run = data.run || {};
    const stdout = run.stdout || '';
    const stderr = run.stderr || '';
    const exitCode = typeof run.code === 'number' ? run.code : 0;
    const isSuccess = exitCode === 0 && !stderr;

    return {
      success: isSuccess,
      stdout: stdout || run.output || '',
      stderr,
      exitCode,
      executionTimeMs: elapsed,
    };
  } catch (err: any) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      success: false,
      stdout: '',
      stderr: `Network / Execution Error: ${err.message || 'Unable to connect to the compilation service.'}`,
      exitCode: 1,
      executionTimeMs: elapsed,
      error: err.message,
    };
  }
}
