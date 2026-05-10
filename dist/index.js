/*!

	██████╗ ██╗ █████╗ ███╗   ███╗███████╗████████╗██████╗ ██╗ ██████╗██╗  ██╗
	██╔══██╗██║██╔══██╗████╗ ████║██╔════╝╚══██╔══╝██╔══██╗██║██╔════╝██║ ██╔╝
	██║  ██║██║███████║██╔████╔██║█████╗     ██║   ██████╔╝██║██║     █████╔╝
	██║  ██║██║██╔══██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██╗██║██║     ██╔═██╗
	██████╔╝██║██║  ██║██║ ╚═╝ ██║███████╗   ██║   ██║  ██║██║╚██████╗██║  ██╗
	╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝ ╚═════╝╚═╝  ╚═╝	

	Version: 1.1.3
	Généré:  2026-05-10 01:11:19
	Auteur:  Maxime Larrivée-Roy <mlarriveeroy@gmail.com>
	Github:  https://github.com/ZmotriN/midi-audio-player/
	Website: https://zmotrin.github.io/midi-audio-player/
	
*/

// node_modules/midi-player-js/build/index.browser.js
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
var Constants = {
  VERSION: "2.0.17",
  NOTES: [],
  HEADER_CHUNK_LENGTH: 14,
  CIRCLE_OF_FOURTHS: ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb", "Bbb", "Ebb", "Abb"],
  CIRCLE_OF_FIFTHS: ["C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#", "E#"]
};
var allNotes = [["C"], ["C#", "Db"], ["D"], ["D#", "Eb"], ["E"], ["F"], ["F#", "Gb"], ["G"], ["G#", "Ab"], ["A"], ["A#", "Bb"], ["B"]];
var counter = 0;
var _loop = function _loop2(i) {
  allNotes.forEach(function(noteGroup) {
    noteGroup.forEach(function(note) {
      return Constants.NOTES[counter] = note + i;
    });
    counter++;
  });
};
for (i = -1; i <= 9; i++) {
  _loop(i);
}
var i;
var Utils = /* @__PURE__ */ (function() {
  function Utils2() {
    _classCallCheck(this, Utils2);
  }
  _createClass(Utils2, null, [{
    key: "byteToHex",
    value: (
      /**
       * Converts a single byte to a hex string.
       * @param {number} byte
       * @return {string}
       */
      function byteToHex(_byte) {
        return ("0" + _byte.toString(16)).slice(-2);
      }
    )
    /**
     * Converts an array of bytes to a hex string.
     * @param {array} byteArray
     * @return {string}
     */
  }, {
    key: "bytesToHex",
    value: function bytesToHex(byteArray) {
      var hex = [];
      byteArray.forEach(function(_byte2) {
        return hex.push(Utils2.byteToHex(_byte2));
      });
      return hex.join("");
    }
    /**
     * Converts a hex string to a number.
     * @param {string} hexString
     * @return {number}
     */
  }, {
    key: "hexToNumber",
    value: function hexToNumber(hexString) {
      return parseInt(hexString, 16);
    }
    /**
     * Converts an array of bytes to a number.
     * @param {array} byteArray
     * @return {number}
     */
  }, {
    key: "bytesToNumber",
    value: function bytesToNumber(byteArray) {
      return Utils2.hexToNumber(Utils2.bytesToHex(byteArray));
    }
    /**
     * Converts an array of bytes to letters.
     * @param {array} byteArray
     * @return {string}
     */
  }, {
    key: "bytesToLetters",
    value: function bytesToLetters(byteArray) {
      var letters = [];
      byteArray.forEach(function(_byte3) {
        return letters.push(String.fromCharCode(_byte3));
      });
      return letters.join("");
    }
    /**
     * Converts a decimal to it's binary representation.
     * @param {number} dec
     * @return {string}
     */
  }, {
    key: "decToBinary",
    value: function decToBinary(dec) {
      return (dec >>> 0).toString(2);
    }
    /**
     * Determines the length in bytes of a variable length quaantity.  The first byte in given range is assumed to be beginning of var length quantity.
     * @param {array} byteArray
     * @return {number}
     */
  }, {
    key: "getVarIntLength",
    value: function getVarIntLength(byteArray) {
      var currentByte = byteArray[0];
      var byteCount = 1;
      while (currentByte >= 128) {
        currentByte = byteArray[byteCount];
        byteCount++;
      }
      return byteCount;
    }
    /**
     * Reads a variable length value.
     * @param {array} byteArray
     * @return {number}
     */
  }, {
    key: "readVarInt",
    value: function readVarInt(byteArray) {
      var result = 0;
      byteArray.forEach(function(number) {
        var b = number;
        if (b & 128) {
          result += b & 127;
          result <<= 7;
        } else {
          result += b;
        }
      });
      return result;
    }
    /**
     * Decodes base-64 encoded string
     * @param {string} string
     * @return {string}
     */
  }, {
    key: "atob",
    value: (function(_atob) {
      function atob2(_x) {
        return _atob.apply(this, arguments);
      }
      atob2.toString = function() {
        return _atob.toString();
      };
      return atob2;
    })(function(string) {
      if (typeof atob === "function") return atob(string);
      return Buffer.from(string, "base64").toString("binary");
    })
  }]);
  return Utils2;
})();
var Track = /* @__PURE__ */ (function() {
  function Track2(index2, data) {
    _classCallCheck(this, Track2);
    this.enabled = true;
    this.eventIndex = 0;
    this.pointer = 0;
    this.lastTick = 0;
    this.lastStatus = null;
    this.index = index2;
    this.data = data;
    this.delta = 0;
    this.runningDelta = 0;
    this.events = [];
    var lastThreeBytes = this.data.subarray(this.data.length - 3, this.data.length);
    if (!(lastThreeBytes[0] === 255 && lastThreeBytes[1] === 47 && lastThreeBytes[2] === 0)) {
      throw "Invalid MIDI file; Last three bytes of track " + this.index + "must be FF 2F 00 to mark end of track";
    }
  }
  _createClass(Track2, [{
    key: "reset",
    value: function reset() {
      this.enabled = true;
      this.eventIndex = 0;
      this.pointer = 0;
      this.lastTick = 0;
      this.lastStatus = null;
      this.delta = 0;
      this.runningDelta = 0;
      return this;
    }
    /**
     * Sets this track to be enabled during playback.
     * @return {Track}
     */
  }, {
    key: "enable",
    value: function enable() {
      this.enabled = true;
      return this;
    }
    /**
     * Sets this track to be disabled during playback.
     * @return {Track}
     */
  }, {
    key: "disable",
    value: function disable() {
      this.enabled = false;
      return this;
    }
    /**
     * Sets the track event index to the nearest event to the given tick.
     * @param {number} tick
     * @return {Track}
     */
  }, {
    key: "setEventIndexByTick",
    value: function setEventIndexByTick(tick) {
      tick = tick || 0;
      for (var i = 0; i < this.events.length; i++) {
        if (this.events[i].tick >= tick) {
          this.eventIndex = i;
          return this;
        }
      }
    }
    /**
     * Gets byte located at pointer position.
     * @return {number}
     */
  }, {
    key: "getCurrentByte",
    value: function getCurrentByte() {
      return this.data[this.pointer];
    }
    /**
     * Gets count of delta bytes and current pointer position.
     * @return {number}
     */
  }, {
    key: "getDeltaByteCount",
    value: function getDeltaByteCount() {
      return Utils.getVarIntLength(this.data.subarray(this.pointer));
    }
    /**
     * Get delta value at current pointer position.
     * @return {number}
     */
  }, {
    key: "getDelta",
    value: function getDelta() {
      return Utils.readVarInt(this.data.subarray(this.pointer, this.pointer + this.getDeltaByteCount()));
    }
    /**
     * Handles event within a given track starting at specified index
     * @param {number} currentTick
     * @param {boolean} dryRun - If true events will be parsed and returned regardless of time.
     */
  }, {
    key: "handleEvent",
    value: function handleEvent(currentTick, dryRun) {
      dryRun = dryRun || false;
      if (dryRun) {
        var elapsedTicks = currentTick - this.lastTick;
        var delta = this.getDelta();
        var eventReady = elapsedTicks >= delta;
        if (this.pointer < this.data.length && (dryRun || eventReady)) {
          var event = this.parseEvent();
          if (this.enabled) return event;
        }
      } else {
        var events = [];
        while (this.events[this.eventIndex] && this.events[this.eventIndex].tick <= currentTick) {
          if (this.enabled) events.push(this.events[this.eventIndex]);
          this.eventIndex++;
        }
        if (events.length > 0) return events;
      }
      return null;
    }
    /**
     * Get string data from event.
     * @param {number} eventStartIndex
     * @return {string}
     */
  }, {
    key: "getStringData",
    value: function getStringData(eventStartIndex) {
      var varIntLength = Utils.getVarIntLength(this.data.subarray(eventStartIndex + 2));
      var varIntValue = Utils.readVarInt(this.data.subarray(eventStartIndex + 2, eventStartIndex + 2 + varIntLength));
      var letters = Utils.bytesToLetters(this.data.subarray(eventStartIndex + 2 + varIntLength, eventStartIndex + 2 + varIntLength + varIntValue));
      return letters;
    }
    /**
     * Parses event into JSON and advances pointer for the track
     * @return {object}
     */
  }, {
    key: "parseEvent",
    value: function parseEvent() {
      var eventStartIndex = this.pointer + this.getDeltaByteCount();
      var eventJson = {};
      var deltaByteCount = this.getDeltaByteCount();
      eventJson.track = this.index + 1;
      eventJson.delta = this.getDelta();
      this.lastTick = this.lastTick + eventJson.delta;
      this.runningDelta += eventJson.delta;
      eventJson.tick = this.runningDelta;
      eventJson.byteIndex = this.pointer;
      if (this.data[eventStartIndex] == 255) {
        switch (this.data[eventStartIndex + 1]) {
          case 0:
            eventJson.name = "Sequence Number";
            break;
          case 1:
            eventJson.name = "Text Event";
            eventJson.string = this.getStringData(eventStartIndex);
            break;
          case 2:
            eventJson.name = "Copyright Notice";
            break;
          case 3:
            eventJson.name = "Sequence/Track Name";
            eventJson.string = this.getStringData(eventStartIndex);
            break;
          case 4:
            eventJson.name = "Instrument Name";
            eventJson.string = this.getStringData(eventStartIndex);
            break;
          case 5:
            eventJson.name = "Lyric";
            eventJson.string = this.getStringData(eventStartIndex);
            break;
          case 6:
            eventJson.name = "Marker";
            eventJson.string = this.getStringData(eventStartIndex);
            break;
          case 7:
            eventJson.name = "Cue Point";
            eventJson.string = this.getStringData(eventStartIndex);
            break;
          case 9:
            eventJson.name = "Device Name";
            eventJson.string = this.getStringData(eventStartIndex);
            break;
          case 32:
            eventJson.name = "MIDI Channel Prefix";
            break;
          case 33:
            eventJson.name = "MIDI Port";
            eventJson.data = Utils.bytesToNumber([this.data[eventStartIndex + 3]]);
            break;
          case 47:
            eventJson.name = "End of Track";
            break;
          case 81:
            eventJson.name = "Set Tempo";
            eventJson.data = Math.round(6e7 / Utils.bytesToNumber(this.data.subarray(eventStartIndex + 3, eventStartIndex + 6)));
            this.tempo = eventJson.data;
            break;
          case 84:
            eventJson.name = "SMTPE Offset";
            break;
          case 88:
            eventJson.name = "Time Signature";
            eventJson.data = this.data.subarray(eventStartIndex + 3, eventStartIndex + 7);
            eventJson.timeSignature = "" + eventJson.data[0] + "/" + Math.pow(2, eventJson.data[1]);
            break;
          case 89:
            eventJson.name = "Key Signature";
            eventJson.data = this.data.subarray(eventStartIndex + 3, eventStartIndex + 5);
            var sf = eventJson.data[0] > 127 ? eventJson.data[0] - 256 : eventJson.data[0];
            if (sf >= 0) {
              eventJson.keySignature = Constants.CIRCLE_OF_FIFTHS[sf];
            } else {
              eventJson.keySignature = Constants.CIRCLE_OF_FOURTHS[Math.abs(sf)];
            }
            if (eventJson.data[1] == 0) {
              eventJson.keySignature += " Major";
            } else if (eventJson.data[1] == 1) {
              eventJson.keySignature += " Minor";
            }
            break;
          case 127:
            eventJson.name = "Sequencer-Specific Meta-event";
            break;
          default:
            eventJson.name = "Unknown: " + this.data[eventStartIndex + 1].toString(16);
            break;
        }
        var varIntLength = Utils.getVarIntLength(this.data.subarray(eventStartIndex + 2));
        var length = Utils.readVarInt(this.data.subarray(eventStartIndex + 2, eventStartIndex + 2 + varIntLength));
        this.pointer += deltaByteCount + 2 + varIntLength + length;
      } else if (this.data[eventStartIndex] === 240) {
        eventJson.name = "Sysex";
        var varQuantityByteLength = Utils.getVarIntLength(this.data.subarray(eventStartIndex + 1));
        var varQuantityByteValue = Utils.readVarInt(this.data.subarray(eventStartIndex + 1, eventStartIndex + 1 + varQuantityByteLength));
        eventJson.data = this.data.subarray(eventStartIndex + 1 + varQuantityByteLength, eventStartIndex + 1 + varQuantityByteLength + varQuantityByteValue);
        this.pointer += deltaByteCount + 1 + varQuantityByteLength + varQuantityByteValue;
      } else if (this.data[eventStartIndex] === 247) {
        eventJson.name = "Sysex (escape)";
        var _varQuantityByteLength = Utils.getVarIntLength(this.data.subarray(eventStartIndex + 1));
        var _varQuantityByteValue = Utils.readVarInt(this.data.subarray(eventStartIndex + 1, eventStartIndex + 1 + _varQuantityByteLength));
        eventJson.data = this.data.subarray(eventStartIndex + 1 + _varQuantityByteLength, eventStartIndex + 1 + _varQuantityByteLength + _varQuantityByteValue);
        this.pointer += deltaByteCount + 1 + _varQuantityByteLength + _varQuantityByteValue;
      } else {
        if (this.data[eventStartIndex] < 128) {
          eventJson.running = true;
          eventJson.noteNumber = this.data[eventStartIndex];
          eventJson.noteName = Constants.NOTES[this.data[eventStartIndex]];
          eventJson.velocity = this.data[eventStartIndex + 1];
          if (this.lastStatus <= 143) {
            eventJson.name = "Note off";
            eventJson.channel = this.lastStatus - 128 + 1;
            this.pointer += deltaByteCount + 2;
          } else if (this.lastStatus <= 159) {
            eventJson.name = "Note on";
            eventJson.channel = this.lastStatus - 144 + 1;
            this.pointer += deltaByteCount + 2;
          } else if (this.lastStatus <= 175) {
            eventJson.name = "Polyphonic Key Pressure";
            eventJson.channel = this.lastStatus - 160 + 1;
            eventJson.note = Constants.NOTES[this.data[eventStartIndex]];
            eventJson.pressure = this.data[eventStartIndex + 1];
            this.pointer += deltaByteCount + 2;
          } else if (this.lastStatus <= 191) {
            eventJson.name = "Controller Change";
            eventJson.channel = this.lastStatus - 176 + 1;
            eventJson.number = this.data[eventStartIndex];
            eventJson.value = this.data[eventStartIndex + 1];
            this.pointer += deltaByteCount + 2;
          } else if (this.lastStatus <= 207) {
            eventJson.name = "Program Change";
            eventJson.channel = this.lastStatus - 192 + 1;
            eventJson.value = this.data[eventStartIndex + 1];
            this.pointer += deltaByteCount + 1;
          } else if (this.lastStatus <= 223) {
            eventJson.name = "Channel Key Pressure";
            eventJson.channel = this.lastStatus - 208 + 1;
            this.pointer += deltaByteCount + 1;
          } else if (this.lastStatus <= 239) {
            eventJson.name = "Pitch Bend";
            eventJson.channel = this.lastStatus - 224 + 1;
            eventJson.value = (this.data[eventStartIndex + 1] & 127) << 7 | this.data[eventStartIndex] & 127;
            this.pointer += deltaByteCount + 2;
          } else {
            throw "Unknown event (running): ".concat(this.lastStatus);
          }
        } else {
          this.lastStatus = this.data[eventStartIndex];
          if (this.data[eventStartIndex] <= 143) {
            eventJson.name = "Note off";
            eventJson.channel = this.lastStatus - 128 + 1;
            eventJson.noteNumber = this.data[eventStartIndex + 1];
            eventJson.noteName = Constants.NOTES[this.data[eventStartIndex + 1]];
            eventJson.velocity = Math.round(this.data[eventStartIndex + 2] / 127 * 100);
            this.pointer += deltaByteCount + 3;
          } else if (this.data[eventStartIndex] <= 159) {
            eventJson.name = "Note on";
            eventJson.channel = this.lastStatus - 144 + 1;
            eventJson.noteNumber = this.data[eventStartIndex + 1];
            eventJson.noteName = Constants.NOTES[this.data[eventStartIndex + 1]];
            eventJson.velocity = Math.round(this.data[eventStartIndex + 2] / 127 * 100);
            this.pointer += deltaByteCount + 3;
          } else if (this.data[eventStartIndex] <= 175) {
            eventJson.name = "Polyphonic Key Pressure";
            eventJson.channel = this.lastStatus - 160 + 1;
            eventJson.note = Constants.NOTES[this.data[eventStartIndex + 1]];
            eventJson.pressure = this.data[eventStartIndex + 2];
            this.pointer += deltaByteCount + 3;
          } else if (this.data[eventStartIndex] <= 191) {
            eventJson.name = "Controller Change";
            eventJson.channel = this.lastStatus - 176 + 1;
            eventJson.number = this.data[eventStartIndex + 1];
            eventJson.value = this.data[eventStartIndex + 2];
            this.pointer += deltaByteCount + 3;
          } else if (this.data[eventStartIndex] <= 207) {
            eventJson.name = "Program Change";
            eventJson.channel = this.lastStatus - 192 + 1;
            eventJson.value = this.data[eventStartIndex + 1];
            this.pointer += deltaByteCount + 2;
          } else if (this.data[eventStartIndex] <= 223) {
            eventJson.name = "Channel Key Pressure";
            eventJson.channel = this.lastStatus - 208 + 1;
            this.pointer += deltaByteCount + 2;
          } else if (this.data[eventStartIndex] <= 239) {
            eventJson.name = "Pitch Bend";
            eventJson.channel = this.lastStatus - 224 + 1;
            eventJson.value = (this.data[eventStartIndex + 2] & 127) << 7 | this.data[eventStartIndex + 1] & 127;
            this.pointer += deltaByteCount + 3;
          } else {
            throw "Unknown event: ".concat(this.data[eventStartIndex]);
          }
        }
      }
      this.delta += eventJson.delta;
      this.events.push(eventJson);
      return eventJson;
    }
    /**
     * Returns true if pointer has reached the end of the track.
     * @param {boolean}
     */
  }, {
    key: "endOfTrack",
    value: function endOfTrack() {
      if (this.data[this.pointer + 1] == 255 && this.data[this.pointer + 2] == 47 && this.data[this.pointer + 3] == 0) {
        return true;
      }
      return false;
    }
  }]);
  return Track2;
})();
if (!Uint8Array.prototype.forEach) {
  Object.defineProperty(Uint8Array.prototype, "forEach", {
    value: Array.prototype.forEach
  });
}
var Player = /* @__PURE__ */ (function() {
  function Player2(eventHandler, buffer) {
    _classCallCheck(this, Player2);
    this.sampleRate = 5;
    this.startTime = 0;
    this.buffer = buffer || null;
    this.midiChunksByteLength = null;
    this.division;
    this.format;
    this.setTimeoutId = false;
    this.scheduledTime = 0;
    this.tracks = [];
    this.instruments = [];
    this.defaultTempo = 120;
    this.tempo = null;
    this.startTick = 0;
    this.tick = 0;
    this.lastTick = null;
    this.inLoop = false;
    this.totalTicks = 0;
    this.events = [];
    this.totalEvents = 0;
    this.tempoMap = [];
    this.eventListeners = {};
    if (typeof eventHandler === "function") this.on("midiEvent", eventHandler);
  }
  _createClass(Player2, [{
    key: "loadFile",
    value: function loadFile(path) {
      {
        throw "loadFile is only supported on Node.js";
      }
    }
    /**
     * Load an array buffer into the player.
     * @param {array} arrayBuffer - Array buffer of file to be loaded.
     * @return {Player}
     */
  }, {
    key: "loadArrayBuffer",
    value: function loadArrayBuffer(arrayBuffer) {
      this.buffer = new Uint8Array(arrayBuffer);
      return this.fileLoaded();
    }
    /**
     * Load a data URI into the player.
     * @param {string} dataUri - Data URI to be loaded.
     * @return {Player}
     */
  }, {
    key: "loadDataUri",
    value: function loadDataUri(dataUri) {
      var byteString = Utils.atob(dataUri.split(",")[1]);
      var ia = new Uint8Array(byteString.length);
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      this.buffer = ia;
      return this.fileLoaded();
    }
    /**
     * Get filesize of loaded file in number of bytes.
     * @return {number} - The filesize.
     */
  }, {
    key: "getFilesize",
    value: function getFilesize() {
      return this.buffer ? this.buffer.length : 0;
    }
    /**
     * Sets default tempo, parses file for necessary information, and does a dry run to calculate total length.
     * Populates this.events & this.totalTicks.
     * @return {Player}
     */
  }, {
    key: "fileLoaded",
    value: function fileLoaded() {
      if (!this.validate()) throw "Invalid MIDI file; should start with MThd";
      this.defaultTempo = 120;
      return this.setTempo(this.defaultTempo).getDivision().getFormat().getTracks().dryRun();
    }
    /**
     * Validates file using simple means - first four bytes should == MThd.
     * @return {boolean}
     */
  }, {
    key: "validate",
    value: function validate() {
      return Utils.bytesToLetters(this.buffer.subarray(0, 4)) === "MThd";
    }
    /**
     * Gets MIDI file format for loaded file.
     * @return {Player}
     */
  }, {
    key: "getFormat",
    value: function getFormat() {
      this.format = Utils.bytesToNumber(this.buffer.subarray(8, 10));
      return this;
    }
    /**
     * Parses out tracks, places them in this.tracks and initializes this.pointers
     * @return {Player}
     */
  }, {
    key: "getTracks",
    value: function getTracks() {
      this.tracks = [];
      var trackOffset = 0;
      while (trackOffset < this.buffer.length) {
        if (Utils.bytesToLetters(this.buffer.subarray(trackOffset, trackOffset + 4)) == "MTrk") {
          var trackLength = Utils.bytesToNumber(this.buffer.subarray(trackOffset + 4, trackOffset + 8));
          this.tracks.push(new Track(this.tracks.length, this.buffer.subarray(trackOffset + 8, trackOffset + 8 + trackLength)));
        }
        trackOffset += Utils.bytesToNumber(this.buffer.subarray(trackOffset + 4, trackOffset + 8)) + 8;
      }
      var trackChunksByteLength = 0;
      this.tracks.forEach(function(track) {
        trackChunksByteLength += 8 + track.data.length;
      });
      this.midiChunksByteLength = Constants.HEADER_CHUNK_LENGTH + trackChunksByteLength;
      return this;
    }
    /**
     * Enables a track for playing.
     * @param {number} trackNumber - Track number
     * @return {Player}
     */
  }, {
    key: "enableTrack",
    value: function enableTrack(trackNumber) {
      this.tracks[trackNumber - 1].enable();
      return this;
    }
    /**
     * Disables a track for playing.
     * @param {number} - Track number
     * @return {Player}
     */
  }, {
    key: "disableTrack",
    value: function disableTrack(trackNumber) {
      this.tracks[trackNumber - 1].disable();
      return this;
    }
    /**
     * Gets quarter note division of loaded MIDI file.
     * @return {Player}
     */
  }, {
    key: "getDivision",
    value: function getDivision() {
      this.division = Utils.bytesToNumber(this.buffer.subarray(12, Constants.HEADER_CHUNK_LENGTH));
      return this;
    }
    /**
     * The main play loop.
     * @param {boolean} - Indicates whether or not this is being called simply for parsing purposes.  Disregards timing if so.
     * @return {undefined}
     */
  }, {
    key: "playLoop",
    value: function playLoop(dryRun) {
      if (!this.inLoop) {
        this.inLoop = true;
        this.tick = this.getCurrentTick();
        this.tracks.forEach(function(track, index2) {
          if (!dryRun && this.endOfFile()) {
            this.stop();
            this.triggerPlayerEvent("endOfFile");
          } else {
            var result = track.handleEvent(this.tick, dryRun);
            if (dryRun && result) {
              if (result.hasOwnProperty("name") && result.name === "Set Tempo") {
                this.setTempo(result.data);
              }
              if (result.hasOwnProperty("name") && result.name === "Program Change") {
                if (!this.instruments.includes(result.value)) {
                  this.instruments.push(result.value);
                }
              }
            } else if (result) {
              var events = Array.isArray(result) ? result : [result];
              events.forEach(function(event) {
                if (event.hasOwnProperty("name") && event.name === "Set Tempo") {
                  this.setTempo(event.data);
                }
                this.emitEvent(event);
              }, this);
            }
          }
        }, this);
        if (!dryRun && this.isPlaying()) this.triggerPlayerEvent("playing", {
          tick: this.tick
        });
        this.inLoop = false;
      }
    }
    /**
     * Setter for tempo.
     * @param {number} - Tempo in bpm (defaults to 120)
     */
  }, {
    key: "setTempo",
    value: function setTempo(tempo) {
      this.tempo = tempo;
      return this;
    }
    /**
     * Setter for startTime.
     * @param {number} - UTC timestamp
     * @return {Player}
     */
  }, {
    key: "setStartTime",
    value: function setStartTime(startTime) {
      this.startTime = startTime;
      return this;
    }
    /**
     * Start playing loaded MIDI file if not already playing.
     * @return {Player}
     */
  }, {
    key: "play",
    value: function play() {
      if (this.isPlaying()) throw "Already playing...";
      if (!this.startTime) this.startTime = (/* @__PURE__ */ new Date()).getTime();
      this.scheduledTime = Date.now();
      this.schedulePlayLoop(this.sampleRate);
      return this;
    }
    /**
     * Schedules the next play loop iteration, correcting for timer drift.
     * @param {number} delay - Delay in milliseconds before next iteration.
     * @return {undefined}
     */
  }, {
    key: "schedulePlayLoop",
    value: function schedulePlayLoop(delay) {
      var _this = this;
      this.setTimeoutId = setTimeout(function() {
        _this.playLoop();
        if (_this.setTimeoutId !== false) {
          _this.scheduledTime += _this.sampleRate;
          var drift = Date.now() - _this.scheduledTime;
          _this.schedulePlayLoop(Math.max(0, _this.sampleRate - drift));
        }
      }, delay);
    }
    /**
     * Pauses playback if playing.
     * @return {Player}
     */
  }, {
    key: "pause",
    value: function pause() {
      clearTimeout(this.setTimeoutId);
      this.setTimeoutId = false;
      this.scheduledTime = 0;
      this.startTick = this.tick;
      this.startTime = 0;
      return this;
    }
    /**
     * Stops playback if playing.
     * @return {Player}
     */
  }, {
    key: "stop",
    value: function stop() {
      clearTimeout(this.setTimeoutId);
      this.setTimeoutId = false;
      this.scheduledTime = 0;
      this.startTick = 0;
      this.startTime = 0;
      this.resetTracks();
      return this;
    }
    /**
     * Skips player pointer to specified tick.
     * @param {number} - Tick to skip to.
     * @return {Player}
     */
  }, {
    key: "skipToTick",
    value: function skipToTick(tick) {
      this.stop();
      this.startTick = tick;
      for (var i = this.tempoMap.length - 1; i >= 0; i--) {
        if (this.tempoMap[i].tick <= tick) {
          this.setTempo(this.tempoMap[i].tempo);
          break;
        }
      }
      this.collectStateAtTick(tick).forEach(function(event) {
        this.emitEvent(event);
      }, this);
      this.tracks.forEach(function(track) {
        track.setEventIndexByTick(tick);
      });
      return this;
    }
    /**
     * Collects the last state-changing MIDI events (Program Change, Controller Change, Pitch Bend)
     * before the specified tick across all tracks.
     * @param {number} tick - Target tick to collect state up to.
     * @return {array} - Array of state events representing the MIDI state at the target tick.
     */
  }, {
    key: "collectStateAtTick",
    value: function collectStateAtTick(tick) {
      var dominated = {};
      this.events.forEach(function(trackEvents) {
        trackEvents.forEach(function(event) {
          if (event.tick >= tick) return;
          var key;
          if (event.name === "Program Change") {
            key = "pc:" + event.channel;
          } else if (event.name === "Controller Change") {
            key = "cc:" + event.channel + ":" + event.number;
          } else if (event.name === "Pitch Bend") {
            key = "pb:" + event.channel;
          }
          if (key) {
            dominated[key] = event;
          }
        });
      });
      return Object.keys(dominated).map(function(key) {
        return dominated[key];
      });
    }
    /**
     * Skips player pointer to specified percentage.
     * @param {number} - Percent value in integer format.
     * @return {Player}
     */
  }, {
    key: "skipToPercent",
    value: function skipToPercent(percent) {
      if (percent < 0 || percent > 100) throw "Percent must be number between 1 and 100.";
      this.skipToTick(Math.round(percent / 100 * this.totalTicks));
      return this;
    }
    /**
     * Skips player pointer to specified seconds.
     * @param {number} - Seconds to skip to.
     * @return {Player}
     */
  }, {
    key: "skipToSeconds",
    value: function skipToSeconds(seconds) {
      var songTime = this.getSongTime();
      if (seconds < 0 || seconds > songTime) throw seconds + " seconds not within song time of " + songTime;
      this.skipToTick(this.secondsToTicks(seconds));
      return this;
    }
    /**
     * Checks if player is playing
     * @return {boolean}
     */
  }, {
    key: "isPlaying",
    value: function isPlaying() {
      return this.setTimeoutId !== false;
    }
    /**
     * Plays the loaded MIDI file without regard for timing and saves events in this.events.  Essentially used as a parser.
     * @return {Player}
     */
  }, {
    key: "dryRun",
    value: function dryRun() {
      this.resetTracks();
      while (!this.endOfFile()) {
        this.playLoop(true);
      }
      this.events = this.getEvents();
      this.totalEvents = this.getTotalEvents();
      this.totalTicks = this.getTotalTicks();
      this.buildTempoMap();
      this.startTick = 0;
      this.startTime = 0;
      this.resetTracks();
      this.triggerPlayerEvent("fileLoaded", this);
      return this;
    }
    /**
     * Resets play pointers for all tracks.
     * @return {Player}
     */
  }, {
    key: "resetTracks",
    value: function resetTracks() {
      this.tracks.forEach(function(track) {
        return track.reset();
      });
      return this;
    }
    /**
     * Gets an array of events grouped by track.
     * @return {array}
     */
  }, {
    key: "getEvents",
    value: function getEvents() {
      return this.tracks.map(function(track) {
        return track.events;
      });
    }
    /**
     * Gets total number of ticks in the loaded MIDI file.
     * @return {number}
     */
  }, {
    key: "getTotalTicks",
    value: function getTotalTicks() {
      return Math.max.apply(null, this.tracks.map(function(track) {
        return track.delta;
      }));
    }
    /**
     * Gets total number of events in the loaded MIDI file.
     * @return {number}
     */
  }, {
    key: "getTotalEvents",
    value: function getTotalEvents() {
      return this.tracks.reduce(function(a, b) {
        return {
          events: {
            length: a.events.length + b.events.length
          }
        };
      }, {
        events: {
          length: 0
        }
      }).events.length;
    }
    /**
     * Builds a tempo map from all Set Tempo events across all tracks.
     * @return {Player}
     */
  }, {
    key: "buildTempoMap",
    value: function buildTempoMap() {
      var tempoEvents = [];
      this.events.forEach(function(trackEvents) {
        trackEvents.forEach(function(event) {
          if (event.name === "Set Tempo") {
            tempoEvents.push({
              tick: event.tick,
              tempo: event.data
            });
          }
        });
      });
      tempoEvents.sort(function(a, b) {
        return a.tick - b.tick;
      });
      this.tempoMap = [{
        tick: 0,
        tempo: this.defaultTempo
      }];
      tempoEvents.forEach(function(event) {
        var last = this.tempoMap[this.tempoMap.length - 1];
        if (event.tick === last.tick) {
          last.tempo = event.tempo;
        } else {
          this.tempoMap.push({
            tick: event.tick,
            tempo: event.tempo
          });
        }
      }, this);
      return this;
    }
    /**
     * Converts a tick range to seconds using the tempo map.
     * @param {number} startTick
     * @param {number} endTick
     * @return {number}
     */
  }, {
    key: "ticksToSeconds",
    value: function ticksToSeconds(startTick, endTick) {
      var seconds = 0;
      var currentTick = startTick;
      for (var i = 0; i < this.tempoMap.length; i++) {
        var entry = this.tempoMap[i];
        var nextTick = i + 1 < this.tempoMap.length ? this.tempoMap[i + 1].tick : endTick;
        if (nextTick <= startTick) continue;
        var segStart = Math.max(entry.tick, startTick);
        var segEnd = Math.min(nextTick, endTick);
        if (segStart >= endTick) break;
        var segmentTicks = segEnd - segStart;
        seconds += segmentTicks / this.division / entry.tempo * 60;
        currentTick = segEnd;
      }
      if (currentTick < endTick) {
        var lastEntry = this.tempoMap[this.tempoMap.length - 1];
        seconds += (endTick - currentTick) / this.division / lastEntry.tempo * 60;
      }
      return seconds;
    }
    /**
     * Converts seconds to a tick position using the tempo map.
     * @param {number} seconds
     * @return {number}
     */
  }, {
    key: "secondsToTicks",
    value: function secondsToTicks(seconds) {
      var remainingSeconds = seconds;
      var currentTick = 0;
      for (var i = 0; i < this.tempoMap.length; i++) {
        var entry = this.tempoMap[i];
        var nextTick = i + 1 < this.tempoMap.length ? this.tempoMap[i + 1].tick : Infinity;
        var segmentTicks = nextTick - entry.tick;
        var segmentSeconds = segmentTicks / this.division / entry.tempo * 60;
        if (remainingSeconds <= segmentSeconds) {
          currentTick = entry.tick + Math.round(remainingSeconds / 60 * entry.tempo * this.division);
          return currentTick;
        }
        remainingSeconds -= segmentSeconds;
        currentTick = nextTick;
      }
      return this.totalTicks;
    }
    /**
     * Gets song duration in seconds.
     * @return {number}
     */
  }, {
    key: "getSongTime",
    value: function getSongTime() {
      return this.ticksToSeconds(0, this.totalTicks);
    }
    /**
     * Gets remaining number of seconds in playback.
     * @return {number}
     */
  }, {
    key: "getSongTimeRemaining",
    value: function getSongTimeRemaining() {
      return Math.round(this.ticksToSeconds(this.getCurrentTick(), this.totalTicks));
    }
    /**
     * Gets remaining percent of playback.
     * @return {number}
     */
  }, {
    key: "getSongPercentRemaining",
    value: function getSongPercentRemaining() {
      return Math.round(this.getSongTimeRemaining() / this.getSongTime() * 100);
    }
    /**
     * Number of bytes processed in the loaded MIDI file.
     * @return {number}
     */
  }, {
    key: "bytesProcessed",
    value: function bytesProcessed() {
      return Constants.HEADER_CHUNK_LENGTH + this.tracks.length * 8 + this.tracks.reduce(function(a, b) {
        return {
          pointer: a.pointer + b.pointer
        };
      }, {
        pointer: 0
      }).pointer;
    }
    /**
     * Number of events played up to this point.
     * @return {number}
     */
  }, {
    key: "eventsPlayed",
    value: function eventsPlayed() {
      return this.tracks.reduce(function(a, b) {
        return {
          eventIndex: a.eventIndex + b.eventIndex
        };
      }, {
        eventIndex: 0
      }).eventIndex;
    }
    /**
     * Determines if the player pointer has reached the end of the loaded MIDI file.
     * Used in two ways:
     * 1. If playing result is based on loaded JSON events.
     * 2. If parsing (dryRun) it's based on the actual buffer length vs bytes processed.
     * @return {boolean}
     */
  }, {
    key: "endOfFile",
    value: function endOfFile() {
      if (this.isPlaying()) {
        return this.totalTicks - this.tick <= 0;
      }
      return this.bytesProcessed() >= this.midiChunksByteLength;
    }
    /**
     * Gets the current tick number in playback.
     * @return {number}
     */
  }, {
    key: "getCurrentTick",
    value: function getCurrentTick() {
      if (!this.startTime) return this.startTick;
      var elapsedSeconds = ((/* @__PURE__ */ new Date()).getTime() - this.startTime) / 1e3;
      var startSeconds = this.ticksToSeconds(0, this.startTick);
      return this.secondsToTicks(startSeconds + elapsedSeconds);
    }
    /**
     * Sends MIDI event out to listener.
     * @param {object}
     * @return {Player}
     */
  }, {
    key: "emitEvent",
    value: function emitEvent(event) {
      this.triggerPlayerEvent("midiEvent", event);
      return this;
    }
    /**
     * Subscribes events to listeners
     * @param {string} - Name of event to subscribe to.
     * @param {function} - Callback to fire when event is broadcast.
     * @return {Player}
     */
  }, {
    key: "on",
    value: function on(playerEvent, fn) {
      if (!this.eventListeners.hasOwnProperty(playerEvent)) this.eventListeners[playerEvent] = [];
      this.eventListeners[playerEvent].push(fn);
      return this;
    }
    /**
     * Broadcasts event to trigger subscribed callbacks.
     * @param {string} - Name of event.
     * @param {object} - Data to be passed to subscriber callback.
     * @return {Player}
     */
  }, {
    key: "triggerPlayerEvent",
    value: function triggerPlayerEvent(playerEvent, data) {
      if (this.eventListeners.hasOwnProperty(playerEvent)) this.eventListeners[playerEvent].forEach(function(fn) {
        return fn(data || {});
      });
      return this;
    }
  }]);
  return Player2;
})();
var index = {
  Player,
  Utils,
  Constants
};

// src/webaudiofontplayer.js
var WebAudioFontPlayer = class {
  #audioCtx = null;
  #preset = null;
  #envelopes = [];
  #afterTime = 0.05;
  #nearZero = 1e-6;
  constructor(audioCtx, preset) {
    this.#audioCtx = audioCtx;
    this.#preset = preset;
    this.#preset.zones.map((zone) => this.#adjustZone(zone));
  }
  queueWaveTable(when, pitch, duration, volume, slides) {
    if (this.#audioCtx.state === "suspended") this.#audioCtx.resume().catch(() => {
    });
    const vol = this.#limitVolume(volume);
    const zone = this.#findZone(pitch);
    if (!zone?.buffer) return null;
    const baseDetune = zone.originalPitch - 100 * zone.coarseTune - zone.fineTune;
    const playbackRate = Math.pow(2, (100 * pitch - baseDetune) / 1200);
    const startWhen = Math.max(when, this.#audioCtx.currentTime);
    let waveDuration = duration + this.#afterTime;
    const loop = zone.loopStart >= 1 && zone.loopStart < zone.loopEnd;
    if (!loop) waveDuration = Math.min(waveDuration, zone.buffer.duration / playbackRate);
    const envelope = this.#findEnvelope();
    this.#setupEnvelope(envelope, zone, vol, startWhen, waveDuration, duration);
    const source = this.#audioCtx.createBufferSource();
    source.buffer = zone.buffer;
    source.playbackRate.setValueAtTime(playbackRate, 0);
    if (slides?.length > 0) {
      source.playbackRate.setValueAtTime(playbackRate, startWhen);
      slides.forEach((s) => {
        const newRate = Math.pow(2, (100 * (pitch + s.delta) - baseDetune) / 1200);
        source.playbackRate.linearRampToValueAtTime(newRate, startWhen + s.when);
      });
    }
    source.loop = loop;
    if (loop) {
      const d = zone.delay ?? 0;
      source.loopStart = zone.loopStart / zone.sampleRate + d;
      source.loopEnd = zone.loopEnd / zone.sampleRate + d;
    }
    source.connect(envelope);
    source.start(startWhen, zone.delay ?? 0);
    source.stop(startWhen + waveDuration);
    envelope.audioBufferSourceNode = source;
    envelope.when = startWhen;
    envelope.duration = waveDuration;
    return envelope;
  }
  queueChord(prst, w, pchs, d, v, s) {
    const vol = this.#limitVolume(v);
    return pchs.map((p, i) => this.queueWaveTable(this.#audioCtx, this.#audioCtx.destination, prst, w, p, d, vol - Math.random() * 0.01, s?.[i])).filter(Boolean);
  }
  async cancelQueue() {
    this.#envelopes.forEach((e) => {
      e.gain.cancelScheduledValues(0);
      e.gain.setValueAtTime(this.#nearZero, this.#audioCtx.currentTime);
      e.when = -1;
      try {
        e.audioBufferSourceNode?.disconnect();
      } catch (e2) {
      }
    });
  }
  #adjustZone(zone) {
    if (zone.buffer) return Promise.resolve(zone);
    zone.delay = 0;
    if (zone.sample) {
      const binaryString = atob(zone.sample);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      const int16Samples = new Int16Array(bytes.buffer);
      const numSamples = int16Samples.length;
      zone.buffer = this.#audioCtx.createBuffer(1, numSamples, zone.sampleRate);
      const float32Array = zone.buffer.getChannelData(0);
      for (let i = 0; i < numSamples; i++) float32Array[i] = int16Samples[i] / 32768;
      this.#applyZoneParameters(zone);
      return zone;
    } else if (zone.file) {
      const decoded = atob(zone.file);
      const uint8Array = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) uint8Array[i] = decoded.charCodeAt(i);
      this.#audioCtx.decodeAudioData(
        uint8Array.buffer,
        (audioBuffer) => {
          zone.buffer = audioBuffer;
          this.#applyZoneParameters(zone);
          return zone;
        },
        (error) => {
          console.error("Audio decoding error:", error);
          return false;
        }
      );
    } else {
      this.#applyZoneParameters(zone);
      return zone;
    }
  }
  #applyZoneParameters(zone) {
    zone.loopStart = this.#numValue(zone.loopStart, 0);
    zone.loopEnd = this.#numValue(zone.loopEnd, 0);
    zone.coarseTune = this.#numValue(zone.coarseTune, 0);
    zone.fineTune = this.#numValue(zone.fineTune, 0);
    zone.originalPitch = this.#numValue(zone.originalPitch, 6e3);
    zone.sampleRate = this.#numValue(zone.sampleRate, 44100);
  }
  #setupEnvelope(envelope, zone, volume, when, sampleDuration, noteDuration) {
    envelope.gain.setValueAtTime(this.#noZeroVolume(0), this.#audioCtx.currentTime);
    const duration = Math.min(noteDuration, sampleDuration - this.#afterTime);
    const ahdsr = zone.ahdsr && zone.ahdsr.length > 0 ? zone.ahdsr : [
      { duration: 0, volume: 1 },
      { duration, volume: 1 }
    ];
    envelope.gain.cancelScheduledValues(when);
    const initialVol = (ahdsr[0]?.volume ?? 1) * volume;
    envelope.gain.setValueAtTime(this.#noZeroVolume(initialVol), when);
    let lastTime = 0;
    let lastVolume = ahdsr[0]?.volume ?? 1;
    for (const stage of ahdsr) {
      const { duration: stageDuration, volume: stageVolume } = stage;
      if (stageDuration <= 0) continue;
      const remainingTime = duration - lastTime;
      if (stageDuration > remainingTime) {
        const ratio = remainingTime / stageDuration;
        const interpolatedVolume = lastVolume + ratio * (stageVolume - lastVolume);
        envelope.gain.linearRampToValueAtTime(
          this.#noZeroVolume(volume * interpolatedVolume),
          when + duration
        );
        break;
      }
      lastTime += stageDuration;
      lastVolume = stageVolume;
      envelope.gain.linearRampToValueAtTime(
        this.#noZeroVolume(volume * lastVolume),
        when + lastTime
      );
    }
    envelope.gain.linearRampToValueAtTime(this.#noZeroVolume(0), when + duration + this.#afterTime);
  }
  #findEnvelope() {
    let envelope = this.#envelopes.find((e) => e.target === this.#audioCtx.destination && this.#audioCtx.currentTime > e.when + e.duration + 1e-3);
    if (envelope) {
      if (envelope.audioBufferSourceNode) {
        try {
          envelope.audioBufferSourceNode.stop(0);
          envelope.audioBufferSourceNode.disconnect();
        } catch (e) {
        }
        envelope.audioBufferSourceNode = null;
      }
    } else {
      envelope = this.#audioCtx.createGain();
      envelope.gain.value = 0;
      envelope.target = this.#audioCtx.destination;
      envelope.connect(this.#audioCtx.destination);
      envelope.cancel = () => {
        if (envelope.when + envelope.duration > this.#audioCtx.currentTime) {
          envelope.gain.cancelScheduledValues(0);
          envelope.gain.setTargetAtTime(this.#nearZero, this.#audioCtx.currentTime, 0.1);
          envelope.when = this.#audioCtx.currentTime + 1e-5;
          envelope.duration = 0;
        }
      };
      this.#envelopes.push(envelope);
    }
    return envelope;
  }
  #findZone(pitch) {
    const zone = this.#preset.zones.findLast((z) => pitch >= z.keyRangeLow && pitch <= z.keyRangeHigh + 1);
    if (zone) this.#adjustZone(zone);
    return zone;
  }
  #limitVolume(v) {
    const requestedVolume = v ? 1 * v : 0.5;
    return Math.min(requestedVolume, 0.8);
  }
  #noZeroVolume(n) {
    return n > this.#nearZero ? n : this.#nearZero;
  }
  #numValue(a, b) {
    return typeof a === "number" ? a : b;
  }
};

// src/presets/defaultpreset.json
var defaultpreset_default = {
  zones: [
    {
      midi: 81,
      originalPitch: 4200,
      keyRangeLow: 0,
      keyRangeHigh: 43,
      loopStart: 256,
      loopEnd: 768,
      coarseTune: 0,
      fineTune: 0,
      sampleRate: 48e3,
      ahdsr: false,
      file: "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjcyLjEwMQAAAAAAAAAAAAAA//tUwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAGAACgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCg//////////////////////////////////////////////////////////////////8AAAAATGF2YzU3Ljk2AAAAAAAAAAAAAAAAJALAAAAAAAAABgA5CeiPAAAAAAAAAAAAAAAAAAAA//vUxAAAB+gfQ1TwACTywCx/NYAJAABZOW7fg6F8L8A3AOwb5L2e7x5R5EoCADB8HwfPxACAYrB8H8oCDsHw/lAQdlwPqDHh/UCEp4fhiU8/ynv6BAGOZS1NzNUNm83W5HHJGz4Kk0TfzwzSZu8CgJ3TZ11pu3hi1hoxY8qMFcPAcBX40CM1RcwUo9EFQgiY2VPldy90c24GUwVQROZnA0ZXohQyMsyIBlAWEQK/zrsHfSBGmF4i+yiKKKNrP5FDrYJM+8XdeIRR1FaEwk0mLq5Upl0G35bBliJz8DxCcgSVtAYMpU27BVbW0tSXOzHsLU+88MTkCQ3PwO05aTrtqwF1G2YFHc7M1hamc5RYnJXbn6S9OU7L2apytcaEpk5bQVbXIszWrUzuzNatW5HKL05K+z9Jyip+vcyqG3yZTDELa1DcIazEIXV3jW1lV3jW1lV7h/M/7h/M/7h/9/+f/f/n/3/58qr2JTUtyqvYlNy3TXbFLct012xS3Kemu0lLWp6arSexu7G62Ja2Ja2Ja0QsKrWx13Wb36/a/7/ew5kMjLhQNcmAxqICUIjQsMqB4zeSzGokEALDBOxI2OrTTJJMLBUwcCQYAVMDdlQ0A6Zkis4q5jIAQzknMdGQMBLAltWVxZrJm4ma0hGaGCmrpKmfS87RrhMci3muq5p4+b4wKbPCqVlsBQHbcmCKhmxoZcGGmnZmJeZOEmiGS7nGjrWX5mn+j92HZJcMqKDIgYz0vMnJTHwUzYoMiIGdQNMuTIbj/U13dLc1aMqCjSTkzEvMpCTQjQy4qMkBjPTGR3X9pMI1N9q1aWtWpqtUyspMhBTOCwyYkMeAjNSsyUjMdATMCYyIgpZJZygGm+AqXGzWrWqtWzWrWjGgAy0lMhHwEXmVERjw4AigycfMdGwMVmSDhjQwCiSU1solVxiNamhqlpYZx3jllljvHLWWLlv/F3cfyKO+/8vfx/JY/7/y9/H8lj/v/Pv5Dk5D8bn4xGJyNxuf1llvHHWWW8cdZZbx//u0xLeAL2H/Z7nNkIFVkCR3sMAFx1llvHHWVbHGrllWAbmu1l2+wACIJmablgZJEkGiBRmRmRKSQMOakoAW1jywyxmXRDkBISlWnK1b7K0xdxcdLomjI+e1lat9latrlly7rLnrbVat8FFQgpgKeCmxTcgrgVVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      anchor: 533333e-8
    },
    {
      midi: 81,
      originalPitch: 5400,
      keyRangeLow: 44,
      keyRangeHigh: 55,
      loopStart: 128,
      loopEnd: 384,
      coarseTune: 0,
      fineTune: 0,
      sampleRate: 48e3,
      ahdsr: false,
      file: "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjcyLjEwMQAAAAAAAAAAAAAA//tUwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAEsADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM//////////////////////////////////////////////////////////////////8AAAAATGF2YzU3Ljk2AAAAAAAAAAAAAAAAJATAAAAAAAAABLAMEvhQAAAAAAAAAAAAAAAAAAAA//vUxAAACSwNaVQwACRXSC6/NYAIAAa9txyS8qHAwMDPlz5QEIIROfLn1AhBBy3lz/BCt5c/wQz5c/RBCXPlw/EEEHLPlz9EEOt8QQQcs+XPykQVh8uH4gcIHLD6w+JgcGkGbGakSCqjColKJDEMCR4mYQ8kQZ1UAiwCAIbAc4b1maEch6LAEVzMhwxuYQGCgLBWbmQSPi+kAzkOM6i/Ei2XrGgFiMbisXednEOO7NP9KJdLKedbxd7vvezh3pl/YdmreFqxnZjEgf+NyN/I1TXaWzqnqWqTOzTyyihuX0cMUlNa3S81TYWrGd63q/RRuno4xSUUbt3YzSYU1fuH8z/uH8zp6OMUlFK6e/KKTG5zKZy+ax/+4fzP+4fzP70rp78opL1PXv0lSzVy+tjjVyyrY41e4fzf91/N/3X83/dfzf91/N/3X5/3D+b/uv5v+6/m/7r/3/6/9/+sst446yy3jVyyrY41csq2ONXLKtjjVyyrKiLXdbW5JI24SEB1CQjhFAAXAIxdxbUKO0ekXEuKphJ5DkSgYKJVFFxQVwUwFDcRcUFcFcCjsTYoK4K4FHYmxQXwrgUdibFBfCvCjsTcRXhXhT8TcRXhXhT8TcRXhXhT8TcRXhXhT8TcakxBTUUzLjk5LjWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//tkxMWDzQgxS7zzACgAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
      anchor: 266667e-8
    },
    {
      midi: 81,
      originalPitch: 6600,
      keyRangeLow: 56,
      keyRangeHigh: 67,
      loopStart: 64,
      loopEnd: 192,
      coarseTune: 0,
      fineTune: 0,
      sampleRate: 48e3,
      ahdsr: false,
      file: "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjcyLjEwMQAAAAAAAAAAAAAA//tUwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAE4ADs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs//////////////////////////////////////////////////////////////////8AAAAATGF2YzU3Ljk2AAAAAAAAAAAAAAAAJAXAAAAAAAAABODQyktQAAAAAAAAAAAAAAAAAAAA//vkxAAABywBgbQAACYVyC6/P9AwKAASUcckkt4YWD4fLn1AhBCJz5c+oEFghy5/ghy5+cghy7+GKZd/DHLn1HIYk5d/DHL+6H5d5TOdLnbLTLKrBqyq+vlkqeD4lCzTAngBgvMYACAAGg+NZZoFwogYAGAZCwCsDgBJsJhRJLyYvYUvg4BLFAA9AKpqYxQCumE3hMhEBIkBkBLuNR5oOGzUbs0Jk7jR1yTFgpzGY2TMgWV8qtT4fmaf4xDKgxlNgzTGRZScSFbPVQxarGZbWMLiNMUC1MshXMJx+MRSeaZHnuceOvbGrV2ls6MOQUMAAnMDAzMMgRMAQkMCQufiahT9zMJfim7ul5rIDBEFgJBgHgoHQuBANAwFA1WkUbqzssyns944flv09UjUcU9kjkkk9UjZfjOyzKep8Z2kxucyq9+ax9JFNJNJNZNFNFNVNJNJNbKRRvGQxjKejfJ2Udq/9bf1darY41U0U0U1U0k0k+k0U0U+U0k0k+k0e5/zD+5/zD+5/zX93/Nf3f81/d////////7/9f+//X/v/1/7/9Jop8ppJpJ9Jop6qwppJ7KxJGp6qwpHKrKxI2qqqwo3KrKxI2qqq9RuVWV8jaqqr1G5TEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sUxNoDwAAB/hwAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      anchor: 133333e-8
    },
    {
      midi: 81,
      originalPitch: 7800,
      keyRangeLow: 68,
      keyRangeHigh: 79,
      loopStart: 32,
      loopEnd: 96,
      coarseTune: 0,
      fineTune: 0,
      sampleRate: 48e3,
      ahdsr: false,
      file: "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjcyLjEwMQAAAAAAAAAAAAAA//tUwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADwADm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm//////////////////////////////////////////////////////////////////8AAAAATGF2YzU3Ljk2AAAAAAAAAAAAAAAAJAZAAAAAAAAAA8CsVDBMAAAAAAAAAAAAAAAAAAAA//vExAAABmQBjaAAACGQBa9497AdtbAkWdckklxRyjhQ5BBYYqOFHRAXDHKHOGOUOcMco7nOJHawxynnOU5cMcHOXOcHOl3NXGMqsiEAqoMI8QsSUcIsgeiQgJISFCg5ABAyw+VQaiK8yY18FNiuxBUorwU0FdiC4ivimgrsQXEV4KaCuxBcTfBXAv4isTfiuBf6KxN+L4r8RUU3wXoL+JsU3wXoL+JsV3gvRSpMQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqq6goZoAABEOiCXDs8P3G8oicJAhZjVVVBlsStNFVVUT8StNVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sUxOuDxEQnByYExigAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      anchor: 66667e-8
    },
    {
      midi: 81,
      originalPitch: 9e3,
      keyRangeLow: 80,
      keyRangeHigh: 91,
      loopStart: 16,
      loopEnd: 48,
      coarseTune: 0,
      fineTune: 0,
      sampleRate: 48e3,
      ahdsr: false,
      file: "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjcyLjEwMQAAAAAAAAAAAAAA//tUwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADwADm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm//////////////////////////////////////////////////////////////////8AAAAATGF2YzU3Ljk2AAAAAAAAAAAAAAAAJAaAAAAAAAAAA8ChXkahAAAAAAAAAAAAAAAAAAAA//vExAAABkQDh+AAACGUhq9895iZZVlzMgFEYk0nBACCLQfD6gTB8/qBDBwMflC4f/gQMfqBMH/4OHP4Df+XBw5+UBN/6wJu1fapqZhlttyF2FyUYQ0W0QkFSJiRIro4TAYk8aQCAQCAKjiRIkSr+xQUFOBQUV/5BQU4KChv+CgoL4KCu/4QUN8KCn/8UFN8FFf/wgp/hQ3/8FBXYgoL/+FBX5BQ3/8FBfigopVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sUxNoDwAAB/gAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      anchor: 33333e-8
    },
    {
      midi: 81,
      originalPitch: 10200,
      keyRangeLow: 92,
      keyRangeHigh: 103,
      loopStart: 8,
      loopEnd: 56,
      coarseTune: 0,
      fineTune: 0,
      sampleRate: 48e3,
      ahdsr: false,
      file: "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjcyLjEwMQAAAAAAAAAAAAAA//tUwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADwADm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm//////////////////////////////////////////////////////////////////8AAAAATGF2YzU3Ljk2AAAAAAAAAAAAAAAAJAaAAAAAAAAAA8AljJJeAAAAAAAAAAAAAAAAAAAA//vExAAABmgDh+AAACG7Cq649JmAh3unfGYwJRhSgQBBEXB8PjogBDn8EwfP6gQdicP/g4GOXB/lHfgmH905/UclwcOf/8oA/2r/qekIFM1D+AxK8OEgo9IhpLSJFdJaehzC3CbBom0GChJpEiRn/tRxIkSJT6OJJB3BUFXSwNB3BUFQVgqCoaqBoGsqd4iBo8oGgaTWCoaxEDR6VBUFTpUFQV//BoGoiBoO//rxKCv//iIGv/+WTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sUxNoDwAAB/gAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      anchor: 16667e-8
    },
    {
      midi: 81,
      originalPitch: 11400,
      keyRangeLow: 104,
      keyRangeHigh: 115,
      loopStart: 12,
      loopEnd: 52,
      coarseTune: 0,
      fineTune: 0,
      sampleRate: 48e3,
      ahdsr: false,
      file: "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjcyLjEwMQAAAAAAAAAAAAAA//tUwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADwADm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm//////////////////////////////////////////////////////////////////8AAAAATGF2YzU3Ljk2AAAAAAAAAAAAAAAAJAaAAAAAAAAAA8CNr1v4AAAAAAAAAAAAAAAAAAAA//vExAAAB1SVheCEbeI4SC349ApomIy4jYiPtA6x5AACs4xjvkAAPmMY/wAXzGMf4AL/X+IgG4PvwQOfIQQOZcH//wQlwfBA5/1h/iB2sP/17/1GMvIAEJ8BiUYMEW0NSAKQjJWj5HCbB/EGHqQ5m2plUuYL1WvVqeGZmb/VVVf9mZr/1VVX9hYGwKgFgbB9TCwNgbB8BG6lKUreYxjfKUrfQxvylK3oYxjeUKAgICJYoCAgICUvoYxvylL9DGN9SlL9P+UrfMYxjOoYCAgIUb6lL////////qUpSzASTEFNRTMuOTkuNaqqqqpMQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//sUxNoDwAAB/gAAACAAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
      anchor: 8333e-8
    },
    {
      midi: 81,
      originalPitch: 12600,
      keyRangeLow: 116,
      keyRangeHigh: 127,
      loopStart: 6,
      loopEnd: 42,
      coarseTune: 0,
      fineTune: 0,
      sampleRate: 48e3,
      ahdsr: false,
      file: "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjcyLjEwMQAAAAAAAAAAAAAA//tUwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAEIADo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo//////////////////////////////////////////////////////////////////8AAAAATGF2YzU3Ljk2AAAAAAAAAAAAAAAAJAaQAAAAAAAABCDWHfeqAAAAAAAAAAAAAAAAAAAA//vUxAAACUUrfeCE1eMLSCx88a54l3jMh4t/trUApEAAAUAGYxja+WMYx/yAAH+MY/+AYx/4AAX8xjH/7/8AF//zHyAMdoIAgAAADAYWTt4IA/Kc5/////////y4Pg/v3FZropQkAAAEiDVBBhkjdBSk5JyDlHqDmWi+kJRsJiOZ69eva6x+zAQEBCm/9VVVb/9mVVL/9mZmP/6qqqn/8ZlVV/6zMzM3/VCgICanXX+5I2JRJHaana+SSNwIQEQAwAQAQEw6j5KBCASACACAKAmBGHcdr5RNR2jtJRsed/DkTU1NTra/3Oc5znf+1rWuc7/3Na1ra/9znOc7/9rWtc7/9zWta3/4c5znO/9rTU1NXOvbW4lDtDyHkPI7TqQIQAxMQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//sUxNoDwAABpAAAACAAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
      anchor: 4167e-8
    }
  ]
};

// src/midiaudioplayer.js
var MidiAudioPlayer = class extends index.Player {
  #audioCtx = null;
  #audioPlayer = null;
  #activeNotes = null;
  #opts = {
    preset: defaultpreset_default,
    volume: 0.012,
    onEndFile: null
  };
  constructor(opts = {}) {
    super((event) => this.#handleMidiPipeline(event));
    this.#opts = { ...this.#opts, ...opts };
    this.#activeNotes = /* @__PURE__ */ new Map();
    this.#audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.#audioPlayer = new WebAudioFontPlayer(this.#audioCtx, this.#opts.preset);
    this.on("endOfFile", async () => {
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 1)));
      await this.#endOfFile();
    });
  }
  async load(content) {
    if (this.isPlaying()) this.stop();
    this.#clearActiveNotes();
    await this.loadArrayBuffer(content);
  }
  async play(content = null) {
    if (content) await this.load(content);
    await this.#audioCtx.resume();
    await super.play();
  }
  async pause() {
    await super.pause();
    await this.#clearActiveNotes();
    await this.#audioPlayer.cancelQueue();
  }
  async stop() {
    await super.stop();
    await this.#clearActiveNotes();
    await this.#audioPlayer.cancelQueue();
  }
  async #endOfFile() {
    if (typeof this.#opts.onEndFile == "function") await this.#opts.onEndFile();
  }
  async #handleMidiPipeline(event) {
    if (event.name !== "Note on" && event.name !== "Note off") return;
    if (!this.isPlaying()) return;
    if (event.noteNumber === void 0) return;
    const now = this.#audioCtx.currentTime;
    switch (event.name) {
      case "Note on":
        if (event.velocity > 0 && event.velocity <= 127) {
          this.#stopNotePipe(event.noteNumber);
          const vol = event.velocity / 127 * this.#opts.volume;
          const envelope = this.#audioPlayer.queueWaveTable(0, event.noteNumber, 2, vol);
          this.#activeNotes.set(event.noteNumber, envelope);
        } else {
          this.#stopNotePipe(event.noteNumber);
        }
        break;
      case "Note off":
        this.#stopNotePipe(event.noteNumber);
        break;
    }
  }
  #stopNotePipe(noteNumber) {
    const envelope = this.#activeNotes.get(noteNumber);
    if (envelope) {
      envelope.cancel();
      this.#activeNotes.delete(noteNumber);
    }
  }
  #clearActiveNotes() {
    if (this.#activeNotes) {
      this.#activeNotes.forEach((envelope, note) => {
        if (envelope && envelope.cancel) envelope.cancel();
      });
      this.#activeNotes.clear();
    }
  }
};

// index.js
if (typeof window !== "undefined") window.MidiAudioPlayer = MidiAudioPlayer;
var index_default = MidiAudioPlayer;
export {
  MidiAudioPlayer,
  index_default as default
};
//# sourceMappingURL=index.js.map
