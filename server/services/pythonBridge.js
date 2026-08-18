/**
 * RiskGuard - Node.js Express to Python Data Science Bridge
 * Executes Python risk analytics scripts (NumPy, Pandas, SciPy, Scikit-Learn) via child process.
 */

const { execFile } = require('child_process');
const path = require('path');

const PYTHON_SCRIPT = path.join(__dirname, '../../python_analytics/api_bridge.py');

function runPythonAnalytics(action = 'all', inputData = {}) {
  return new Promise((resolve, reject) => {
    const inputStr = JSON.stringify(inputData);
    
    // Command: python python_analytics/api_bridge.py --action <action> --input <json>
    execFile('python', [PYTHON_SCRIPT, '--action', action, '--input', inputStr], (error, stdout, stderr) => {
      if (error) {
        // Fallback gracefully if Python environment is not configured in current PATH
        return resolve({
          python_available: false,
          fallback: true,
          message: 'Executing fallback JS math engine (Python process not found in PATH)'
        });
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve({ python_available: true, data: parsed });
      } catch (e) {
        resolve({ python_available: false, raw_output: stdout });
      }
    });
  });
}

module.exports = { runPythonAnalytics };
