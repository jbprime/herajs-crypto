import bs58check from 'bs58check';
import JSBI from 'jsbi';
import bs58 from 'bs58';
import { ec } from 'elliptic';
import { AES_GCM } from 'asmcrypto.js';

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

var ADDRESS_PREFIXES = {
  ACCOUNT: 0x42,
  PRIVATE_KEY: 0xAA
};
var ACCOUNT_NAME_LENGTH = 12;

/**
 * Convert Uint8 array to hex string
 * @param {string} hexString
 * @return {Uint8Array} 
 */

var fromHexString = function fromHexString(hexString) {
  if (hexString.length % 2 === 1) hexString = '0' + hexString;
  var m = hexString.match(/.{1,2}/g);
  if (!m) return new Uint8Array([]);
  return new Uint8Array(m.map(function (byte) {
    return parseInt(byte, 16);
  }));
};
/**
 * Convert number to Uint8 array
 * @param {number} d 
 * @param {number} bitLength default 64, can also use 32
 */


var fromNumber = function fromNumber(d) {
  var bitLength = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 64;
  var bytes = bitLength / 8;

  if (d >= Math.pow(2, bitLength)) {
    throw new Error('Number exeeds uint64 range');
  }

  var arr = new Uint8Array(bytes);

  for (var i = 0, j = 1; i < bytes; i++, j *= 0x100) {
    arr[i] = d / j & 0xff;
  }

  return arr;
};
/**
 * Convert BigInt to Uint8 array
 * @param {JSBI} d 
 */


var fromBigInt = function fromBigInt(d) {
  return fromHexString(JSBI.BigInt(d).toString(16));
};
/**
 * Encodes address form byte array to string.
 * @param {number[]} byteArray 
 * @param {string} address
 */


var encodeAddress = function encodeAddress(byteArray) {
  if (byteArray.length <= ACCOUNT_NAME_LENGTH) {
    return Buffer.from(byteArray).toString();
  }

  var buf = Buffer.from([ADDRESS_PREFIXES.ACCOUNT].concat(_toConsumableArray(byteArray)));
  return bs58check.encode(buf);
};
/**
 * Decodes address from string to byte array.
 * @param {string} address base58check encoded address or name
 * @return {number[]} byte array
 */


var decodeAddress = function decodeAddress(address) {
  if (address.length <= ACCOUNT_NAME_LENGTH) {
    return Buffer.from(address);
  }

  return bs58check.decode(address).slice(1);
};
/**
 * Encodes address form byte array to string.
 * @param {number[]} byteArray 
 * @param {string} address
 */


var encodePrivateKey = function encodePrivateKey(byteArray) {
  var buf = Buffer.from([ADDRESS_PREFIXES.PRIVATE_KEY].concat(_toConsumableArray(byteArray)));
  return bs58check.encode(buf);
};
/**
 * Decodes address from string to byte array.
 * @param {string} address base58check encoded privkey 
 * @return {number[]} byte array
 */


var decodePrivateKey = function decodePrivateKey(key) {
  return bs58check.decode(key).slice(1);
};

function encodeTxHash(bytes) {
  return bs58.encode(Buffer.from(Uint8Array.from(bytes)));
}

var ecdsa = new ec('secp256k1');

/**
 * Encode public key as address
 * @param {ECPoint} publicKey
 * @return {string} base58check encoded address
 */
function addressFromPublicKey(publicKey) {
  var len = publicKey.curve.p.byteLength();
  var x = publicKey.getX().toArray('be', len);
  var address = Uint8Array.from([publicKey.getY().isEven() ? 0x02 : 0x03].concat(x));
  return encodeAddress(address);
}
/**
 * Encodes a key pair into an identity object
 * @param {KeyPair} keyPair 
 * @return {object}
 */

function encodeIdentity(keyPair) {
  //@ts-ignore
  var privateKey = Buffer.from(keyPair.getPrivate().toArray());
  var publicKey = keyPair.getPublic();
  var address = addressFromPublicKey(publicKey);
  return {
    address: address,
    publicKey: publicKey,
    privateKey: privateKey,
    keyPair: keyPair
  };
}
/**
 * Shortcut function to create a new random private key and
 * return keys and address as encoded strings.
 */

function createIdentity() {
  var keyPair = ecdsa.genKeyPair();
  return encodeIdentity(keyPair);
}
/**
 * Returns identity associated with private key
 * @param {Buffer} privKeyBytes 
 */

function identifyFromPrivateKey(privKeyBytes) {
  var keyPair = ecdsa.keyFromPrivate(Buffer.from(privKeyBytes));
  return encodeIdentity(keyPair);
}
/**
 * Retrieve public key from address
 * @param {ECPoint} publicKey
 * @return {string} base58check encoded address
 */

function publicKeyFromAddress(address) {
  var pubkey = decodeAddress(address);
  return ecdsa.keyFromPublic(pubkey);
}

var _keyAndNonceFromPassword = function _keyAndNonceFromPassword(password) {
  // Make a key from double hashing the password
  var hash = ecdsa.hash();
  hash.update(password);
  var addr = hash.digest();
  var rehash = ecdsa.hash();
  rehash.update(password);
  rehash.update(addr);
  var key = Buffer.from(rehash.digest());
  var nonce = Buffer.from(addr.slice(4, 16));
  return [key, nonce];
};

function decryptPrivateKey(encryptedBytes, password) {
  var _keyAndNonceFromPassw = _keyAndNonceFromPassword(password),
      _keyAndNonceFromPassw2 = _slicedToArray(_keyAndNonceFromPassw, 2),
      key = _keyAndNonceFromPassw2[0],
      nonce = _keyAndNonceFromPassw2[1];

  return AES_GCM.decrypt(Uint8Array.from(encryptedBytes), key, nonce);
}
function encryptPrivateKey(clearBytes, password) {
  var _keyAndNonceFromPassw3 = _keyAndNonceFromPassword(password),
      _keyAndNonceFromPassw4 = _slicedToArray(_keyAndNonceFromPassw3, 2),
      key = _keyAndNonceFromPassw4[0],
      nonce = _keyAndNonceFromPassw4[1];

  return AES_GCM.encrypt(Uint8Array.from(clearBytes), key, nonce);
}

var ecdsa$1 = new ec('secp256k1');

function bufferOrB58(input) {
  if (typeof input === 'string') {
    return bs58.decode(input);
  }

  if (typeof input === 'undefined') {
    return new Uint8Array([]);
  }

  return input;
}

function hash(data) {
  var h = ecdsa$1.hash();
  h.update(data);
  return h.digest();
}

function hashTransaction(_x) {
  return _hashTransaction.apply(this, arguments);
}

function _hashTransaction() {
  _hashTransaction = _asyncToGenerator(function* (tx) {
    var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'base64';
    var includeSign = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    // check amount format
    tx.amount = '' + tx.amount;
    if (typeof tx.amount !== 'string') throw new Error(); // this is a type-hint for ts

    var amountUnit = tx.amount.match(/\s*([^0-9]+)\s*/);

    if (amountUnit && amountUnit[1] !== 'aer') {
      throw Error("Can only hash amounts provided in the base unit (aer), not ".concat(tx.amount, ". Convert to aer or remove unit."));
    }

    tx.amount = tx.amount.replace(/[^0-9]/g, '');
    var items = [fromNumber(tx.nonce, 64), decodeAddress(tx.from.toString()), tx.to ? decodeAddress(tx.to.toString()) : Buffer.from([]), fromBigInt(tx.amount ? tx.amount.toString() : 0), tx.payload ? Buffer.from(tx.payload) : Buffer.from([]), fromNumber(tx.limit || 0, 64), fromBigInt(tx.price ? tx.price.toString() : 0), fromNumber(tx.type || 0, 32), Buffer.from(bufferOrB58(tx.chainIdHash))];
    var data = Buffer.concat(items.map(function (item) {
      return Buffer.from(item);
    }));

    if (includeSign && typeof tx.sign !== 'undefined') {
      data = Buffer.concat([data, Buffer.from(tx.sign, 'base64')]);
    }

    var result = hash(data);

    if (encoding == 'base64') {
      return Buffer.from(result).toString('base64');
    } else if (encoding == 'base58') {
      return encodeTxHash(Buffer.from(result));
    } else {
      return result;
    }
  });
  return _hashTransaction.apply(this, arguments);
}

/**
 * Returns signature encoded in DER format in base64.
 * @param sig 
 */

var encodeSignature = function encodeSignature(sig) {
  var enc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'base64';
  return Buffer.from(sig.toDER()).toString(enc);
};
/**
 * Sign transaction with key.
 * @param {object} tx transaction
 * @param {BN} key key pair or private key
 */


var signMessage =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (msgHash, key) {
    var enc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'base64';
    var sig = key.sign(msgHash);
    return encodeSignature(sig, enc);
  });

  return function signMessage(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
/**
 * Sign transaction with key.
 * @param {object} tx transaction
 * @param {BN} key key pair or private key
 */


var signTransaction =
/*#__PURE__*/
function () {
  var _ref2 = _asyncToGenerator(function* (tx, key) {
    var enc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'base64';
    var msgHash = yield hashTransaction(tx, 'bytes', false);
    return signMessage(msgHash, key, enc);
  });

  return function signTransaction(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();
/**
 * Verify that a signature for msg was generated by key
 * @param key key pair or public key
 */


var verifySignature =
/*#__PURE__*/
function () {
  var _ref3 = _asyncToGenerator(function* (msg, key, signature) {
    var enc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'base64';

    try {
      var sign = Buffer.from(signature, enc); // @ts-ignore: the typedef is wrong, a Buffer is an allowed input

      return key.verify(msg, sign);
    } catch (e) {
      throw Error('could not decode signature: ' + e);
    }
  });

  return function verifySignature(_x5, _x6, _x7) {
    return _ref3.apply(this, arguments);
  };
}();
/**
 * Verify that a signature for tx was generated by key
 */


var verifyTxSignature =
/*#__PURE__*/
function () {
  var _ref4 = _asyncToGenerator(function* (tx, key, signature) {
    var msg = yield hashTransaction(tx, 'bytes', false);
    return yield verifySignature(msg, key, signature);
  });

  return function verifyTxSignature(_x8, _x9, _x10) {
    return _ref4.apply(this, arguments);
  };
}();

export { encodeAddress, decodeAddress, encodePrivateKey, decodePrivateKey, createIdentity, identifyFromPrivateKey, addressFromPublicKey, publicKeyFromAddress, decryptPrivateKey, encryptPrivateKey, signMessage, signTransaction, verifySignature, verifyTxSignature, hashTransaction };
