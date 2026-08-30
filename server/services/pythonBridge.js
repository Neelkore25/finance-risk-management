/**
 * RiskGuard - Node.js Express to Python Data Science Bridge
 * Executes Python risk analytics scripts (NumPy, Pandas, SciPy, Scikit-Learn) via child process.
 * Fully buffers stdout stream chunks before JSON parsing on process completion.
 */

const { spawn } = require('child_process');
const path = require('path');

const PYTHON_SCRIPT = path.join(__dirname, '../../python_analytics/api_bridge.py');

function runPythonAnalytics(action = 'all', inputData = {}) {
  return new Promise((resolve) => {
    const inputStr = JSON.stringify(inputData);
    let stdoutBuffer = '';
    let stderrBuffer = '';

    // Spawn python child process
    const pyProcess = spawn('python', [PYTHON_SCRIPT, '--action', action, '--input', inputStr]);

    // Stream accumulation
    pyProcess.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString('utf8');
    });

    pyProcess.stderr.on('data', (chunk) => {
      stderrBuffer += chunk.toString('utf8');
    });

    pyProcess.on('error', (err) => {
      // Fallback gracefully if Python environment is not configured in PATH
      resolve({
        python_available: false,
        fallback: true,
        message: 'Executing fallback JS math engine (Python process not found in PATH)',
        error: err.message
      });
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        return resolve({
          python_available: false,
          fallback: true,
          error: stderrBuffer || `Python process exited with code ${code}`,
          raw_output: stdoutBuffer
        });
      }

      try {
        const parsed = JSON.parse(stdoutBuffer.trim());
        resolve({ python_available: true, data: parsed });
      } catch (parseErr) {
        resolve({
          python_available: false,
          fallback: true,
          error: 'Failed to parse complete JSON from Python process stdout',
          raw_output: stdoutBuffer
        });
      }
    });
  });
}

module.exports = { runPythonAnalytics };
