/**
 * Client service to execute Java code in a sandboxed runtime via OpenJDK execution API.
 */

export interface JavaExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs?: number;
  error?: string;
}

const WANDBOX_ENDPOINT = 'https://wandbox.org/api/compile.json';

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

  // Normalize "public class <Name>" to "class <Name>" so standard Java compiles seamlessly in sandboxed runner
  const normalizedCode = code.replace(/\bpublic\s+class\s+([A-Za-z0-9_$]+)/g, 'class $1');

  try {
    const response = await fetch(WANDBOX_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        compiler: 'openjdk-jdk-21+35',
        code: normalizedCode,
        stdin: stdin || '',
        save: false,
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

    // Check for compilation errors
    const compilerError = data.compiler_error || data.compiler_message || '';
    const rawStatus = data.status;
    const exitCode = typeof rawStatus === 'string' ? parseInt(rawStatus, 10) : (rawStatus || 0);

    if (compilerError && exitCode !== 0) {
      return {
        success: false,
        stdout: data.compiler_output || '',
        stderr: compilerError,
        exitCode,
        executionTimeMs: elapsed,
      };
    }

    // Program execution output
    const stdout = data.program_output || data.program_message || '';
    const stderr = data.program_error || '';
    const isSuccess = exitCode === 0 && !stderr;

    return {
      success: isSuccess,
      stdout,
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
