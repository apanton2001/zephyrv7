/**
 * AI Agency Platform Local Runner
 * 
 * This script helps run the AI Agency Platform locally without Docker.
 * It will install dependencies and start both the frontend and backend services.
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Paths
const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to log with timestamp and color
function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.bright}${colors.cyan}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

// Helper function to run a command in a directory
function runCommand(command, args, cwd, name) {
  log(`Starting ${name}...`, colors.yellow);
  
  const child = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'pipe',
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colors.bright}${colors.green}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colors.bright}${colors.red}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  child.on('close', (code) => {
    if (code !== 0) {
      log(`${name} process exited with code ${code}`, colors.red);
    } else {
      log(`${name} process exited`, colors.yellow);
    }
  });

  return child;
}

// Check if Node.js and Python are installed
function checkPrerequisites() {
  log('Checking prerequisites...', colors.blue);
  
  try {
    // Check Node.js
    const nodeVersion = require('child_process').execSync('node -v').toString().trim();
    log(`Node.js version: ${nodeVersion}`, colors.green);
    
    // Check Python
    const pythonCommand = process.platform === 'win32' ? 'python --version' : 'python3 --version';
    const pythonVersion = require('child_process').execSync(pythonCommand).toString().trim();
    log(`Python version: ${pythonVersion}`, colors.green);
    
    return true;
  } catch (error) {
    log('Error checking prerequisites:', colors.red);
    log(error.message, colors.red);
    return false;
  }
}

// Install frontend dependencies
function installFrontendDependencies() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.join(FRONTEND_DIR, 'node_modules'))) {
      log('Installing frontend dependencies...', colors.blue);
      exec('npm install', { cwd: FRONTEND_DIR }, (error, stdout, stderr) => {
        if (error) {
          log('Error installing frontend dependencies:', colors.red);
          log(error.message, colors.red);
          reject(error);
          return;
        }
        log('Frontend dependencies installed successfully', colors.green);
        resolve();
      });
    } else {
      log('Frontend dependencies already installed', colors.green);
      resolve();
    }
  });
}

// Install backend dependencies
function installBackendDependencies() {
  return new Promise((resolve, reject) => {
    // Check if venv exists
    const venvDir = path.join(BACKEND_DIR, 'venv');
    if (!fs.existsSync(venvDir)) {
      log('Creating Python virtual environment...', colors.blue);
      
      // Create virtual environment
      const venvCommand = process.platform === 'win32' ? 'python -m venv venv' : 'python3 -m venv venv';
      exec(venvCommand, { cwd: BACKEND_DIR }, (error, stdout, stderr) => {
        if (error) {
          log('Error creating virtual environment:', colors.red);
          log(error.message, colors.red);
          reject(error);
          return;
        }
        
        log('Virtual environment created successfully', colors.green);
        
        // Install dependencies in virtual environment
        const pipCommand = process.platform === 'win32' 
          ? 'venv\\Scripts\\pip install -r requirements.txt' 
          : 'venv/bin/pip install -r requirements.txt';
        
        log('Installing backend dependencies...', colors.blue);
        exec(pipCommand, { cwd: BACKEND_DIR }, (error, stdout, stderr) => {
          if (error) {
            log('Error installing backend dependencies:', colors.red);
            log(error.message, colors.red);
            reject(error);
            return;
          }
          log('Backend dependencies installed successfully', colors.green);
          resolve();
        });
      });
    } else {
      log('Backend virtual environment already exists', colors.green);
      resolve();
    }
  });
}

// Start the frontend server
function startFrontend() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return runCommand(npmCommand, ['run', 'dev'], FRONTEND_DIR, 'Frontend');
}

// Start the backend server
function startBackend() {
  const uvicornCommand = process.platform === 'win32' 
    ? 'venv\\Scripts\\uvicorn' 
    : 'venv/bin/uvicorn';
  
  return runCommand(uvicornCommand, ['app.main:app', '--reload'], BACKEND_DIR, 'Backend');
}

// Main function
async function main() {
  console.log('\n');
  log('==================================', colors.bright);
  log('  AI AGENCY PLATFORM LOCAL RUNNER ', colors.bright);
  log('==================================', colors.bright);
  console.log('\n');
  
  if (!checkPrerequisites()) {
    log('Please install Node.js and Python before running this script.', colors.red);
    return;
  }
  
  try {
    // Install dependencies
    await installFrontendDependencies();
    await installBackendDependencies();
    
    console.log('\n');
    log('Starting services...', colors.bright);
    console.log('\n');
    
    // Start services
    const frontendProcess = startFrontend();
    const backendProcess = startBackend();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('Shutting down services...', colors.yellow);
      frontendProcess.kill();
      backendProcess.kill();
      setTimeout(() => {
        log('All services stopped', colors.green);
        process.exit(0);
      }, 1000);
    });
    
    console.log('\n');
    log('Services are running!', colors.green);
    log('- Frontend: http://localhost:3000', colors.green);
    log('- Backend API: http://localhost:8000', colors.green);
    log('- API Documentation: http://localhost:8000/docs', colors.green);
    console.log('\n');
    log('Press Ctrl+C to stop the services', colors.yellow);
  } catch (error) {
    log('Error starting services:', colors.red);
    log(error.message, colors.red);
  }
}

// Run the main function
main();
