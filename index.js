// Scheme: https://tools.ietf.org/html/rfc3986#section-3.1
// Absolute URL: https://tools.ietf.org/html/rfc3986#section-4.3
const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/;

// HTTP(S) protocols only for maximum security
const HTTP_PROTOCOLS_REGEX = /^https?:/i;

// Cache for validation results - Map with max size to prevent memory leaks
const CACHE_MAX_SIZE = 1000;
const validationCache = new Map();

// Fast path check for common protocols
function hasCommonHttpProtocol(url) {
	// Check for common HTTP protocols without regex for better performance
	const char1 = url.codePointAt(0);
	const char2 = url.codePointAt(1);
	const char3 = url.codePointAt(2);
	const char4 = url.codePointAt(3);
	const char5 = url.codePointAt(4);

	// Http: (104=h, 116=t, 112=p, 58=:)
	if (char1 === 104 && char2 === 116 && char3 === 116 && char4 === 112 && char5 === 58) {
		return true;
	}

	// HTTP: (72=H, 84=T, 80=P, 58=:)
	if (char1 === 72 && char2 === 84 && char3 === 84 && char4 === 80 && char5 === 58) {
		return true;
	}

	// Https: or HTTPS: (check 6th char for 's' or 'S')
	const char6 = url.codePointAt(5);
	// Https:
	if (char1 === 104 && char2 === 116 && char3 === 116 && char4 === 112 && char5 === 115 && char6 === 58) {
		return true;
	}

	// HTTPS:
	if (char1 === 72 && char2 === 84 && char3 === 84 && char4 === 80 && char5 === 83 && char6 === 58) {
		return true;
	}

	// Mixed case variations (hTtP, Http, etc.) - fall back to string comparison
	const firstSix = url.slice(0, 6).toLowerCase();
	return firstSix === 'http:' || firstSix === 'https:';
}

function isWindowsPath(url) {
	// Check for Windows path: [a-zA-Z]:\
	// A-Z: 65-90, a-z: 97-122, colon: 58, backslash: 92
	if (url.length < 3) {
		return false;
	}

	const firstChar = url.codePointAt(0);
	const secondChar = url.codePointAt(1);
	const thirdChar = url.codePointAt(2);

	return ((firstChar >= 65 && firstChar <= 90) || (firstChar >= 97 && firstChar <= 122))
		&& secondChar === 58
		&& thirdChar === 92;
}

function evictOldestCacheEntry() {
	const firstKey = validationCache.keys().next().value;
	validationCache.delete(firstKey);
}

export default function isAbsoluteUrl(url, options = {}) {
	if (typeof url !== 'string') {
		throw new TypeError(`Expected a \`string\`, got \`${typeof url}\``);
	}

	// Default httpOnly to true for security
	const {httpOnly = true} = options;

	// Create cache key including options
	const cacheKey = `${url}|${httpOnly}`;

	// Check cache first
	if (validationCache.has(cacheKey)) {
		return validationCache.get(cacheKey);
	}

	let result;

	// Fast path: Windows path check using codePointAt for better performance
	if (isWindowsPath(url)) {
		result = false;

		// Cache and return
		if (validationCache.size >= CACHE_MAX_SIZE) {
			evictOldestCacheEntry();
		}

		validationCache.set(cacheKey, result);
		return result;
	}

	// Fast path for common HTTP(S) protocols when httpOnly is true
	if (httpOnly && url.length >= 5 && hasCommonHttpProtocol(url)) {
		result = true;

		// Cache and return
		if (validationCache.size >= CACHE_MAX_SIZE) {
			evictOldestCacheEntry();
		}

		validationCache.set(cacheKey, result);
		return result;
	}

	// Standard validation path
	// When httpOnly is true, only allow HTTP(S) protocols; when false, allow any absolute URL
	result = ABSOLUTE_URL_REGEX.test(url)
		? (httpOnly ? HTTP_PROTOCOLS_REGEX.test(url) : true)
		: false;

	// Cache result with LRU eviction
	if (validationCache.size >= CACHE_MAX_SIZE) {
		evictOldestCacheEntry();
	}

	validationCache.set(cacheKey, result);

	return result;
}
