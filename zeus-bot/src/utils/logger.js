const COLORS = {
  reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', white: '\x1b[37m'
};

function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function formatModule(module) {
  return module.padEnd(12).substring(0, 12);
}

export const logger = {
  info: (module, message) => console.log(`${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ${COLORS.cyan}[${formatModule(module)}]${COLORS.reset} ${message}`),
  success: (module, message) => console.log(`${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ${COLORS.green}[${formatModule(module)}] ✓ ${message}${COLORS.reset}`),
  warn: (module, message) => console.log(`${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ${COLORS.yellow}[${formatModule(module)}] ⚠ ${message}${COLORS.reset}`),
  error: (module, message) => console.log(`${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ${COLORS.red}[${formatModule(module)}] ✗ ${message}${COLORS.reset}`),
  thunder: (message) => console.log(`${COLORS.yellow}${COLORS.bright}⚡ [${getTimestamp()}] ${message} ⚡${COLORS.reset}`),
  logo: () => console.log(`${COLORS.yellow}${COLORS.bright}\n    ⚡ ZEUS ⚡\n${COLORS.reset}`),
  divider: () => console.log(`${COLORS.yellow}${'═'.repeat(60)}${COLORS.reset}`),
  box: (title, content) => {
    console.log(`${COLORS.yellow}╔${'═'.repeat(58)}╗${COLORS.reset}`);
    console.log(`${COLORS.yellow}║${COLORS.reset} ${COLORS.bright}${title.padEnd(56)}${COLORS.reset} ${COLORS.yellow}║${COLORS.reset}`);
    console.log(`${COLORS.yellow}╠${'═'.repeat(58)}╣${COLORS.reset}`);
    content.forEach(line => console.log(`${COLORS.yellow}║${COLORS.reset} ${line.padEnd(56)} ${COLORS.yellow}║${COLORS.reset}`));
    console.log(`${COLORS.yellow}╚${'═'.repeat(58)}╝${COLORS.reset}`);
  }
};

export default logger;
