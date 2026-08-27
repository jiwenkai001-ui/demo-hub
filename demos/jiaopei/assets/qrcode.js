/*
 * QR Code generator library
 */
(function(global) {
  'use strict';

  var ECC = { LOW: 0, MEDIUM: 1, QUARTILE: 2, HIGH: 3 };

  function QRCode(text, ecl) {
    ecl = ecl || ECC.MEDIUM;
    var data = encodeText(text);
    var version = 1;
    for (; version <= 40; version++) {
      var capacity = getNumDataCodewords(version, ecl) * 8;
      if (data.length <= capacity) break;
    }
    if (version > 40) version = 40;

    var size = version * 4 + 17;
    this.size = size;
    this.modules = [];
    for (var i = 0; i < size; i++) {
      this.modules[i] = [];
      for (var j = 0; j < size; j++) {
        this.modules[i][j] = null;
      }
    }

    drawFinderPatterns(this);
    drawAlignmentPatterns(this, version);
    drawTimingPatterns(this);
    drawFormatBits(this, ecl, 0);

    var allCodewords = appendErrorCorrection(data, version, ecl);
    drawCodewords(this, allCodewords);

    var bestMask = 0;
    var bestPenalty = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      drawFormatBits(this, ecl, mask);
      applyMask(this, mask);
      var penalty = getPenalty(this);
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        bestMask = mask;
      }
      applyMask(this, mask);
    }
    drawFormatBits(this, ecl, bestMask);
    applyMask(this, bestMask);
  }

  QRCode.prototype.getModule = function(x, y) {
    return this.modules[y][x] === true;
  };

  function encodeText(text) {
    var bytes = [];
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c < 0x80) {
        bytes.push(c);
      } else if (c < 0x800) {
        bytes.push(0xC0 | (c >> 6));
        bytes.push(0x80 | (c & 0x3F));
      } else {
        bytes.push(0xE0 | (c >> 12));
        bytes.push(0x80 | ((c >> 6) & 0x3F));
        bytes.push(0x80 | (c & 0x3F));
      }
    }

    var version = 1;
    for (; version <= 40; version++) {
      var capacity = getNumDataCodewords(version, 1) * 8;
      var bitsNeeded = 4 + (version < 10 ? 8 : 16) + bytes.length * 8;
      if (bitsNeeded <= capacity) break;
    }
    if (version > 40) version = 40;

    var charCountBits = version < 10 ? 8 : 16;
    var result = [];
    appendBits(result, 0x4, 4);
    appendBits(result, bytes.length, charCountBits);
    for (var i = 0; i < bytes.length; i++) {
      appendBits(result, bytes[i], 8);
    }

    var dataCapacity = getNumDataCodewords(version, 1) * 8;
    appendBits(result, 0, Math.min(4, dataCapacity - result.length));
    while (result.length % 8 !== 0) result.push(0);

    var padByte = 0xEC;
    for (var i = 0; result.length < dataCapacity; i++) {
      appendBits(result, padByte, 8);
      padByte = padByte === 0xEC ? 0x11 : 0xEC;
    }

    return result;
  }

  function appendBits(result, val, len) {
    for (var i = len - 1; i >= 0; i--) {
      result.push((val >>> i) & 1);
    }
  }

  function drawFinderPatterns(qr) {
    var size = qr.size;
    var corners = [[0, 0], [size - 7, 0], [0, size - 7]];
    for (var c = 0; c < corners.length; c++) {
      var cx = corners[c][0], cy = corners[c][1];
      for (var dy = 0; dy < 7; dy++) {
        for (var dx = 0; dx < 7; dx++) {
          var dist = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
          var color = dist !== 2 && dist !== 4;
          setModule(qr, cx + dx, cy + dy, color);
        }
      }
    }
    for (var i = 0; i < 8; i++) {
      setModule(qr, 7, i, false);
      setModule(qr, i, 7, false);
      setModule(qr, size - 8, i, false);
      setModule(qr, size - 1 - i, 7, false);
      setModule(qr, 7, size - 1 - i, false);
      setModule(qr, i, size - 8, false);
    }
  }

  function drawAlignmentPatterns(qr, version) {
    var positions = getAlignmentPatternPositions(version);
    for (var i = 0; i < positions.length; i++) {
      for (var j = 0; j < positions.length; j++) {
        var cx = positions[i], cy = positions[j];
        if (qr.modules[cy][cx] !== null) continue;
        for (var dy = -2; dy <= 2; dy++) {
          for (var dx = -2; dx <= 2; dx++) {
            var color = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
            setModule(qr, cx + dx, cy + dy, color);
          }
        }
      }
    }
  }

  function drawTimingPatterns(qr) {
    var size = qr.size;
    for (var i = 8; i < size - 8; i++) {
      var color = i % 2 === 0;
      if (qr.modules[6][i] === null) setModule(qr, i, 6, color);
      if (qr.modules[i][6] === null) setModule(qr, 6, i, color);
    }
  }

  function drawFormatBits(qr, ecl, mask) {
    var data = (ecl << 3) | mask;
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;

    var size = qr.size;
    for (var i = 0; i <= 5; i++) setModule(qr, i, 8, ((bits >> i) & 1) === 1);
    setModule(qr, 7, 8, ((bits >> 6) & 1) === 1);
    setModule(qr, 8, 8, ((bits >> 7) & 1) === 1);
    setModule(qr, 8, 7, ((bits >> 8) & 1) === 1);
    for (var i = 9; i < 15; i++) setModule(qr, 8, 14 - i, ((bits >> i) & 1) === 1);

    for (var i = 0; i < 8; i++) setModule(qr, size - 1 - i, 8, ((bits >> i) & 1) === 1);
    for (var i = 8; i < 15; i++) setModule(qr, 8, size - 15 + i, ((bits >> i) & 1) === 1);
    setModule(qr, 8, size - 8, true);
  }

  function drawCodewords(qr, data) {
    var size = qr.size;
    var i = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j;
          var upward = ((right + 1) & 2) === 0;
          var y = upward ? size - 1 - vert : vert;
          if (qr.modules[y][x] === null && i < data.length) {
            qr.modules[y][x] = data[i] === 1;
            i++;
          }
        }
      }
    }
  }

  function applyMask(qr, mask) {
    var size = qr.size;
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        var invert;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = (x * y) % 2 + (x * y) % 3 === 0; break;
          case 6: invert = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
          case 7: invert = ((x + y) % 2 + (x * y) % 3) % 2 === 0; break;
          default: throw new Error('Invalid mask');
        }
        if (invert && isDataModule(qr, x, y)) {
          qr.modules[y][x] = !qr.modules[y][x];
        }
      }
    }
  }

  function isDataModule(qr, x, y) {
    return true;
  }

  function getPenalty(qr) {
    var size = qr.size;
    var penalty = 0;
    for (var y = 0; y < size; y++) {
      var runColor = false;
      var runX = 0;
      for (var x = 0; x < size; x++) {
        if (qr.modules[y][x] === runColor) {
          runX++;
          if (runX === 5) penalty += 3;
          else if (runX > 5) penalty += 1;
        } else {
          runColor = qr.modules[y][x];
          runX = 1;
        }
      }
    }
    return penalty;
  }

  function setModule(qr, x, y, color) {
    qr.modules[y][x] = color;
  }

  function getAlignmentPatternPositions(version) {
    if (version === 1) return [];
    var numAlign = Math.floor(version / 7) + 2;
    var step = (version === 32) ? 26 :
      Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
    var result = [6];
    for (var pos = version * 4 + 10; result.length < numAlign; pos -= step) {
      result.splice(1, 0, pos);
    }
    return result;
  }

  function getNumDataCodewords(version, ecl) {
    var total = getNumRawDataModules(version) / 8;
    var ecCodewords = getNumEccCodewords(version, ecl);
    return Math.floor(total - ecCodewords);
  }

  function getNumRawDataModules(version) {
    var result = (16 * version + 128) * version + 64;
    if (version >= 2) {
      var numAlign = Math.floor(version / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (version >= 7) result -= 36;
    }
    return result;
  }

  function getNumEccCodewords(version, ecl) {
    var table = {
      1: [7, 10, 13, 17], 2: [10, 16, 22, 28], 3: [15, 26, 36, 44],
      4: [20, 36, 52, 64], 5: [26, 48, 72, 88], 6: [36, 64, 96, 112],
      7: [40, 72, 108, 130], 8: [48, 88, 132, 156], 9: [60, 110, 160, 192],
      10: [72, 130, 192, 224], 15: [120, 200, 280, 340], 20: [180, 280, 400, 480]
    };
    var v = table[version];
    if (v) return v[ecl];
    var base = version * 10 + 5;
    return Math.floor(base * [0.5, 0.7, 0.9, 1.2][ecl]);
  }

  function appendErrorCorrection(dataBits, version, ecl) {
    var numDataCodewords = getNumDataCodewords(version, ecl);
    var result = [];
    for (var i = 0; i < dataBits.length && i < numDataCodewords * 8; i++) {
      result.push(dataBits[i]);
    }
    while (result.length < numDataCodewords * 8) result.push(0);
    var totalCodewords = getNumRawDataModules(version) / 8;
    while (result.length < totalCodewords * 8) result.push(0);
    return result;
  }

  function renderToCanvas(canvas, text, options) {
    options = options || {};
    var qr = new QRCode(text, eclFromString(options.ecl));
    var size = qr.size;
    var scale = options.scale || 4;
    var margin = options.margin || 4;
    var modulesize = scale;
    var totalSize = (size + margin * 2) * modulesize;
    canvas.width = totalSize;
    canvas.height = totalSize;
    var ctx = canvas.getContext('2d');
    if (options.bgColor) {
      ctx.fillStyle = options.bgColor;
      ctx.fillRect(0, 0, totalSize, totalSize);
    }
    ctx.fillStyle = options.fgColor || '#000000';
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        if (qr.getModule(x, y)) {
          ctx.fillRect((x + margin) * modulesize, (y + margin) * modulesize, modulesize, modulesize);
        }
      }
    }
  }

  function eclFromString(s) {
    if (!s) return ECC.MEDIUM;
    s = s.toUpperCase();
    if (s === 'L') return ECC.LOW;
    if (s === 'M') return ECC.MEDIUM;
    if (s === 'Q') return ECC.QUARTILE;
    if (s === 'H') return ECC.HIGH;
    return ECC.MEDIUM;
  }

  global.QRCodeGen = {
    generate: function(text, options) {
      return new QRCode(text, eclFromString(options && options.ecl));
    },
    renderToCanvas: renderToCanvas,
    ECC: ECC
  };

})(window);
