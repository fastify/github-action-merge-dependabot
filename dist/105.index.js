"use strict";
exports.id = 105;
exports.ids = [105];
exports.modules = {

/***/ 8770:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const fs = __webpack_require__(7147);
const os = __webpack_require__(2037);

const tempDirectorySymbol = Symbol.for('__RESOLVED_TEMP_DIRECTORY__');

if (!global[tempDirectorySymbol]) {
	Object.defineProperty(global, tempDirectorySymbol, {
		value: fs.realpathSync(os.tmpdir())
	});
}

module.exports = global[tempDirectorySymbol];


/***/ }),

/***/ 4105:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "rootTemporaryDirectory": () => (/* reexport */ temp_dir),
  "temporaryDirectory": () => (/* binding */ temporaryDirectory),
  "temporaryDirectoryTask": () => (/* binding */ temporaryDirectoryTask),
  "temporaryFile": () => (/* binding */ temporaryFile),
  "temporaryFileTask": () => (/* binding */ temporaryFileTask),
  "temporaryWrite": () => (/* binding */ temporaryWrite),
  "temporaryWriteSync": () => (/* binding */ temporaryWriteSync),
  "temporaryWriteTask": () => (/* binding */ temporaryWriteTask)
});

// EXTERNAL MODULE: external "node:fs"
var external_node_fs_ = __webpack_require__(7561);
// EXTERNAL MODULE: external "node:fs/promises"
var promises_ = __webpack_require__(3977);
// EXTERNAL MODULE: external "node:path"
var external_node_path_ = __webpack_require__(9411);
// EXTERNAL MODULE: external "node:stream"
var external_node_stream_ = __webpack_require__(4492);
// EXTERNAL MODULE: external "node:util"
var external_node_util_ = __webpack_require__(7261);
// EXTERNAL MODULE: external "util"
var external_util_ = __webpack_require__(3837);
// EXTERNAL MODULE: external "crypto"
var external_crypto_ = __webpack_require__(6113);
;// CONCATENATED MODULE: ./node_modules/crypto-random-string/index.js



const randomBytesAsync = (0,external_util_.promisify)(external_crypto_.randomBytes);

const urlSafeCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~'.split('');
const numericCharacters = '0123456789'.split('');
const distinguishableCharacters = 'CDEHKMPRTUWXY012458'.split('');
const asciiPrintableCharacters = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'.split('');
const alphanumericCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');

const generateForCustomCharacters = (length, characters) => {
	// Generating entropy is faster than complex math operations, so we use the simplest way
	const characterCount = characters.length;
	const maxValidSelector = (Math.floor(0x10000 / characterCount) * characterCount) - 1; // Using values above this will ruin distribution when using modular division
	const entropyLength = 2 * Math.ceil(1.1 * length); // Generating a bit more than required so chances we need more than one pass will be really low
	let string = '';
	let stringLength = 0;

	while (stringLength < length) { // In case we had many bad values, which may happen for character sets of size above 0x8000 but close to it
		const entropy = external_crypto_.randomBytes(entropyLength);
		let entropyPosition = 0;

		while (entropyPosition < entropyLength && stringLength < length) {
			const entropyValue = entropy.readUInt16LE(entropyPosition);
			entropyPosition += 2;
			if (entropyValue > maxValidSelector) { // Skip values which will ruin distribution when using modular division
				continue;
			}

			string += characters[entropyValue % characterCount];
			stringLength++;
		}
	}

	return string;
};

const generateForCustomCharactersAsync = async (length, characters) => {
	// Generating entropy is faster than complex math operations, so we use the simplest way
	const characterCount = characters.length;
	const maxValidSelector = (Math.floor(0x10000 / characterCount) * characterCount) - 1; // Using values above this will ruin distribution when using modular division
	const entropyLength = 2 * Math.ceil(1.1 * length); // Generating a bit more than required so chances we need more than one pass will be really low
	let string = '';
	let stringLength = 0;

	while (stringLength < length) { // In case we had many bad values, which may happen for character sets of size above 0x8000 but close to it
		const entropy = await randomBytesAsync(entropyLength); // eslint-disable-line no-await-in-loop
		let entropyPosition = 0;

		while (entropyPosition < entropyLength && stringLength < length) {
			const entropyValue = entropy.readUInt16LE(entropyPosition);
			entropyPosition += 2;
			if (entropyValue > maxValidSelector) { // Skip values which will ruin distribution when using modular division
				continue;
			}

			string += characters[entropyValue % characterCount];
			stringLength++;
		}
	}

	return string;
};

const generateRandomBytes = (byteLength, type, length) => external_crypto_.randomBytes(byteLength).toString(type).slice(0, length);

const generateRandomBytesAsync = async (byteLength, type, length) => {
	const buffer = await randomBytesAsync(byteLength);
	return buffer.toString(type).slice(0, length);
};

const allowedTypes = new Set([
	undefined,
	'hex',
	'base64',
	'url-safe',
	'numeric',
	'distinguishable',
	'ascii-printable',
	'alphanumeric'
]);

const createGenerator = (generateForCustomCharacters, generateRandomBytes) => ({length, type, characters}) => {
	if (!(length >= 0 && Number.isFinite(length))) {
		throw new TypeError('Expected a `length` to be a non-negative finite number');
	}

	if (type !== undefined && characters !== undefined) {
		throw new TypeError('Expected either `type` or `characters`');
	}

	if (characters !== undefined && typeof characters !== 'string') {
		throw new TypeError('Expected `characters` to be string');
	}

	if (!allowedTypes.has(type)) {
		throw new TypeError(`Unknown type: ${type}`);
	}

	if (type === undefined && characters === undefined) {
		type = 'hex';
	}

	if (type === 'hex' || (type === undefined && characters === undefined)) {
		return generateRandomBytes(Math.ceil(length * 0.5), 'hex', length); // Need 0.5 byte entropy per character
	}

	if (type === 'base64') {
		return generateRandomBytes(Math.ceil(length * 0.75), 'base64', length); // Need 0.75 byte of entropy per character
	}

	if (type === 'url-safe') {
		return generateForCustomCharacters(length, urlSafeCharacters);
	}

	if (type === 'numeric') {
		return generateForCustomCharacters(length, numericCharacters);
	}

	if (type === 'distinguishable') {
		return generateForCustomCharacters(length, distinguishableCharacters);
	}

	if (type === 'ascii-printable') {
		return generateForCustomCharacters(length, asciiPrintableCharacters);
	}

	if (type === 'alphanumeric') {
		return generateForCustomCharacters(length, alphanumericCharacters);
	}

	if (characters.length === 0) {
		throw new TypeError('Expected `characters` string length to be greater than or equal to 1');
	}

	if (characters.length > 0x10000) {
		throw new TypeError('Expected `characters` string length to be less or equal to 65536');
	}

	return generateForCustomCharacters(length, characters.split(''));
};

const cryptoRandomString = createGenerator(generateForCustomCharacters, generateRandomBytes);

cryptoRandomString.async = createGenerator(generateForCustomCharactersAsync, generateRandomBytesAsync);

/* harmony default export */ const crypto_random_string = (cryptoRandomString);

;// CONCATENATED MODULE: ./node_modules/unique-string/index.js


function uniqueString() {
	return crypto_random_string({length: 32});
}

// EXTERNAL MODULE: ./node_modules/temp-dir/index.js
var temp_dir = __webpack_require__(8770);
;// CONCATENATED MODULE: ./node_modules/tempy/node_modules/is-stream/index.js
function isStream(stream) {
	return stream !== null
		&& typeof stream === 'object'
		&& typeof stream.pipe === 'function';
}

function isWritableStream(stream) {
	return isStream(stream)
		&& stream.writable !== false
		&& typeof stream._write === 'function'
		&& typeof stream._writableState === 'object';
}

function isReadableStream(stream) {
	return isStream(stream)
		&& stream.readable !== false
		&& typeof stream._read === 'function'
		&& typeof stream._readableState === 'object';
}

function isDuplexStream(stream) {
	return isWritableStream(stream)
		&& isReadableStream(stream);
}

function isTransformStream(stream) {
	return isDuplexStream(stream)
		&& typeof stream._transform === 'function';
}

;// CONCATENATED MODULE: ./node_modules/tempy/index.js









const pipeline = (0,external_node_util_.promisify)(external_node_stream_.pipeline); // TODO: Use `node:stream/promises` when targeting Node.js 16.

const getPath = (prefix = '') => external_node_path_.join(temp_dir, prefix + uniqueString());

const writeStream = async (filePath, data) => pipeline(data, external_node_fs_.createWriteStream(filePath));

async function runTask(temporaryPath, callback) {
	try {
		return await callback(temporaryPath);
	} finally {
		await promises_.rm(temporaryPath, {recursive: true, force: true});
	}
}

function temporaryFile({name, extension} = {}) {
	if (name) {
		if (extension !== undefined && extension !== null) {
			throw new Error('The `name` and `extension` options are mutually exclusive');
		}

		return external_node_path_.join(temporaryDirectory(), name);
	}

	return getPath() + (extension === undefined || extension === null ? '' : '.' + extension.replace(/^\./, ''));
}

const temporaryFileTask = async (callback, options) => runTask(temporaryFile(options), callback);

function temporaryDirectory({prefix = ''} = {}) {
	const directory = getPath(prefix);
	external_node_fs_.mkdirSync(directory);
	return directory;
}

const temporaryDirectoryTask = async (callback, options) => runTask(temporaryDirectory(options), callback);

async function temporaryWrite(fileContent, options) {
	const filename = temporaryFile(options);
	const write = isStream(fileContent) ? writeStream : promises_.writeFile;
	await write(filename, fileContent);
	return filename;
}

const temporaryWriteTask = async (fileContent, callback, options) => runTask(await temporaryWrite(fileContent, options), callback);

function temporaryWriteSync(fileContent, options) {
	const filename = temporaryFile(options);
	external_node_fs_.writeFileSync(filename, fileContent);
	return filename;
}




/***/ })

};
;