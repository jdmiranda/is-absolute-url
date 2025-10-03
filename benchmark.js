import isAbsoluteUrl from './index.js';

// Benchmark configuration
const ITERATIONS = 1_000_000;

// Test URLs representing different scenarios
const testUrls = {
	httpUrl: 'http://example.com',
	httpsUrl: 'https://example.com',
	ftpUrl: 'ftp://example.com',
	relativePath: '/path/to/file',
	windowsPath: 'c:\\windows\\path',
	complexHttps: 'https://user:pass@example.com:8080/path?query=value#fragment',
	mixedCase: 'HtTpS://example.com',
};

function benchmark(name, fn) {
	const start = performance.now();
	for (let i = 0; i < ITERATIONS; i++) {
		fn();
	}

	const end = performance.now();
	const duration = end - start;
	const opsPerSecond = (ITERATIONS / duration) * 1000;

	return {
		name,
		duration: duration.toFixed(2),
		opsPerSecond: Math.round(opsPerSecond).toLocaleString(),
	};
}

console.log('URL Validation Performance Benchmarks');
console.log('=====================================\n');
console.log(`Running ${ITERATIONS.toLocaleString()} iterations per test...\n`);

const results = [];

// Benchmark 1: HTTP URL (most common case, should hit fast path)
results.push(benchmark('HTTP URL (fast path)', () => {
	isAbsoluteUrl(testUrls.httpUrl);
}));

// Benchmark 2: HTTPS URL (most common case, should hit fast path)
results.push(benchmark('HTTPS URL (fast path)', () => {
	isAbsoluteUrl(testUrls.httpsUrl);
}));

// Benchmark 3: FTP URL (should be rejected by httpOnly)
results.push(benchmark('FTP URL (rejected)', () => {
	isAbsoluteUrl(testUrls.ftpUrl);
}));

// Benchmark 4: Relative path (should be rejected early)
results.push(benchmark('Relative path (fast reject)', () => {
	isAbsoluteUrl(testUrls.relativePath);
}));

// Benchmark 5: Windows path (should hit fast path Windows check)
results.push(benchmark('Windows path (fast path)', () => {
	isAbsoluteUrl(testUrls.windowsPath);
}));

// Benchmark 6: Complex HTTPS URL
results.push(benchmark('Complex HTTPS URL', () => {
	isAbsoluteUrl(testUrls.complexHttps);
}));

// Benchmark 7: Mixed case HTTPS
results.push(benchmark('Mixed case HTTPS', () => {
	isAbsoluteUrl(testUrls.mixedCase);
}));

// Benchmark 8: With httpOnly: false option
results.push(benchmark('HTTP with httpOnly: false', () => {
	isAbsoluteUrl(testUrls.httpUrl, {httpOnly: false});
}));

// Benchmark 9: Cache hit (same URL repeated)
results.push(benchmark('Cache hit (repeated URL)', () => {
	isAbsoluteUrl(testUrls.httpsUrl);
}));

// Display results
console.log('Results:');
console.log('--------');
for (const result of results) {
	console.log(`${result.name.padEnd(35)} ${result.duration.padStart(10)} ms  (${result.opsPerSecond.padStart(15)} ops/sec)`);
}

console.log('\nOptimizations Applied:');
console.log('----------------------');
console.log('1. Pre-compiled regex patterns (module-level constants)');
console.log('2. LRU cache for validation results (max 1000 entries)');
console.log('3. Fast path for common HTTP/HTTPS protocols using codePointAt');
console.log('4. Fast path for Windows path detection using codePointAt');
console.log('5. Optimized conditional logic with ternary expressions');
