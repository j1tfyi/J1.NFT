// Synchronous Buffer polyfill for browser - loads immediately before any app code
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  // Use Uint8Array as base for Buffer implementation
  const BufferPolyfill = function(arg, encodingOrOffset, length) {
    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new TypeError('The "string" argument must be of type string');
      }
      return BufferPolyfill.alloc(arg);
    }
    return BufferPolyfill.from(arg, encodingOrOffset, length);
  };

  BufferPolyfill.alloc = function(size) {
    const buf = new Uint8Array(size);
    Object.setPrototypeOf(buf, BufferPolyfill.prototype);
    return buf;
  };

  BufferPolyfill.from = function(value, encodingOrOffset, length) {
    if (typeof value === 'string') {
      const enc = encodingOrOffset || 'utf8';
      if (enc === 'hex') {
        const bytes = [];
        for (let i = 0; i < value.length; i += 2) {
          bytes.push(parseInt(value.substr(i, 2), 16));
        }
        return BufferPolyfill.from(bytes);
      }
      const encoder = new TextEncoder();
      const arr = encoder.encode(value);
      const buf = new Uint8Array(arr);
      Object.setPrototypeOf(buf, BufferPolyfill.prototype);
      return buf;
    }

    if (value instanceof ArrayBuffer) {
      const buf = new Uint8Array(value, encodingOrOffset, length);
      Object.setPrototypeOf(buf, BufferPolyfill.prototype);
      return buf;
    }

    if (ArrayBuffer.isView(value)) {
      const buf = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      Object.setPrototypeOf(buf, BufferPolyfill.prototype);
      return buf;
    }

    if (Array.isArray(value) || value.length !== undefined) {
      const buf = new Uint8Array(value);
      Object.setPrototypeOf(buf, BufferPolyfill.prototype);
      return buf;
    }

    throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.');
  };

  BufferPolyfill.isBuffer = function(obj) {
    return obj != null && obj._isBuffer === true;
  };

  BufferPolyfill.concat = function(list, totalLength) {
    if (!Array.isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }

    if (list.length === 0) {
      return BufferPolyfill.alloc(0);
    }

    let length = 0;
    if (totalLength === undefined) {
      for (let i = 0; i < list.length; i++) {
        length += list[i].length;
      }
    } else {
      length = totalLength;
    }

    const buffer = BufferPolyfill.alloc(length);
    let pos = 0;
    for (let i = 0; i < list.length; i++) {
      const buf = list[i];
      buffer.set(buf, pos);
      pos += buf.length;
    }
    return buffer;
  };

  BufferPolyfill.prototype = Object.create(Uint8Array.prototype);
  BufferPolyfill.prototype.constructor = BufferPolyfill;
  BufferPolyfill.prototype._isBuffer = true;

  BufferPolyfill.prototype.toString = function(encoding, start, end) {
    encoding = encoding || 'utf8';
    start = start || 0;
    end = end || this.length;

    if (encoding === 'hex') {
      let hex = '';
      for (let i = start; i < end; i++) {
        const byte = this[i].toString(16);
        hex += byte.length === 1 ? '0' + byte : byte;
      }
      return hex;
    }

    const decoder = new TextDecoder(encoding === 'utf8' ? 'utf-8' : encoding);
    return decoder.decode(this.subarray(start, end));
  };

  BufferPolyfill.prototype.slice = function(start, end) {
    const newBuf = Uint8Array.prototype.slice.call(this, start, end);
    Object.setPrototypeOf(newBuf, BufferPolyfill.prototype);
    return newBuf;
  };

  BufferPolyfill.prototype.subarray = function(start, end) {
    const newBuf = Uint8Array.prototype.subarray.call(this, start, end);
    Object.setPrototypeOf(newBuf, BufferPolyfill.prototype);
    return newBuf;
  };

  BufferPolyfill.prototype.readUInt32LE = function(offset) {
    return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24);
  };

  BufferPolyfill.prototype.readUInt32BE = function(offset) {
    return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3]);
  };

  BufferPolyfill.prototype.readUInt8 = function(offset) {
    return this[offset];
  };

  BufferPolyfill.prototype.readUInt16LE = function(offset) {
    return this[offset] | (this[offset + 1] << 8);
  };

  BufferPolyfill.prototype.readUInt16BE = function(offset) {
    return (this[offset] << 8) | this[offset + 1];
  };

  BufferPolyfill.prototype.readInt32LE = function(offset) {
    return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24);
  };

  BufferPolyfill.prototype.readInt32BE = function(offset) {
    return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3]);
  };

  BufferPolyfill.prototype.writeUInt8 = function(value, offset) {
    this[offset] = value & 0xff;
    return offset + 1;
  };

  BufferPolyfill.prototype.writeUInt16LE = function(value, offset) {
    this[offset] = (value & 0xff);
    this[offset + 1] = ((value >>> 8) & 0xff);
    return offset + 2;
  };

  BufferPolyfill.prototype.writeUInt16BE = function(value, offset) {
    this[offset] = ((value >>> 8) & 0xff);
    this[offset + 1] = (value & 0xff);
    return offset + 2;
  };

  BufferPolyfill.prototype.writeUInt32LE = function(value, offset) {
    this[offset] = (value & 0xff);
    this[offset + 1] = ((value >>> 8) & 0xff);
    this[offset + 2] = ((value >>> 16) & 0xff);
    this[offset + 3] = ((value >>> 24) & 0xff);
    return offset + 4;
  };

  BufferPolyfill.prototype.writeUInt32BE = function(value, offset) {
    this[offset] = ((value >>> 24) & 0xff);
    this[offset + 1] = ((value >>> 16) & 0xff);
    this[offset + 2] = ((value >>> 8) & 0xff);
    this[offset + 3] = (value & 0xff);
    return offset + 4;
  };

  BufferPolyfill.prototype.writeInt32LE = function(value, offset) {
    this[offset] = (value & 0xff);
    this[offset + 1] = ((value >>> 8) & 0xff);
    this[offset + 2] = ((value >>> 16) & 0xff);
    this[offset + 3] = ((value >>> 24) & 0xff);
    return offset + 4;
  };

  BufferPolyfill.prototype.write = function(string, offset, length, encoding) {
    if (offset === undefined) {
      encoding = 'utf8';
      length = this.length;
      offset = 0;
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset;
      length = this.length;
      offset = 0;
    }

    const remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;

    if (encoding === 'hex') {
      for (let i = 0; i < length && i * 2 < string.length; i++) {
        const byte = parseInt(string.substr(i * 2, 2), 16);
        if (isNaN(byte)) break;
        this[offset + i] = byte;
      }
      return Math.min(length, Math.floor(string.length / 2));
    }

    const encoder = new TextEncoder();
    const encoded = encoder.encode(string);
    const toCopy = Math.min(encoded.length, length);
    for (let i = 0; i < toCopy; i++) {
      this[offset + i] = encoded[i];
    }
    return toCopy;
  };

  BufferPolyfill.prototype.copy = function(target, targetStart, start, end) {
    if (!start) start = 0;
    if (!end) end = this.length;
    if (!targetStart) targetStart = 0;

    if (end === start) return 0;
    if (target.length === 0 || this.length === 0) return 0;

    const len = end - start;
    for (let i = 0; i < len; i++) {
      target[targetStart + i] = this[start + i];
    }
    return len;
  };

  BufferPolyfill.prototype.fill = function(value, start, end) {
    if (start === undefined) start = 0;
    if (end === undefined) end = this.length;

    if (typeof value === 'number') {
      value = value & 0xff;
    }

    for (let i = start; i < end; i++) {
      this[i] = value;
    }
    return this;
  };

  window.Buffer = BufferPolyfill;
  window.global = window;
  window.process = window.process || { env: {} };

  console.log('[Buffer Polyfill] Loaded successfully. window.Buffer:', typeof window.Buffer);
}