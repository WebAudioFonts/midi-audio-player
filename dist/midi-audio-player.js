/*!

	███╗   ███╗██╗██████╗ ██╗ █████╗ ██╗   ██╗██████╗ ██╗ ██████╗ ██████╗ ██╗      █████╗ ██╗   ██╗███████╗██████╗
	████╗ ████║██║██╔══██╗██║██╔══██╗██║   ██║██╔══██╗██║██╔═══██╗██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝██╔════╝██╔══██╗
	██╔████╔██║██║██║  ██║██║███████║██║   ██║██║  ██║██║██║   ██║██████╔╝██║     ███████║ ╚████╔╝ █████╗  ██████╔╝
	██║╚██╔╝██║██║██║  ██║██║██╔══██║██║   ██║██║  ██║██║██║   ██║██╔═══╝ ██║     ██╔══██║  ╚██╔╝  ██╔══╝  ██╔══██╗
	██║ ╚═╝ ██║██║██████╔╝██║██║  ██║╚██████╔╝██████╔╝██║╚██████╔╝██║     ███████╗██║  ██║   ██║   ███████╗██║  ██║
	╚═╝     ╚═╝╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝

	Version: 2.0.0
	Build:   2026-05-29 17:16:44
	Author:  Maxime Larrivée-Roy <mlarriveeroy@gmail.com>
	Github:  https://github.com/webaudiofonts/midi-audio-player/
	Website: https://webaudiofonts.github.io/midi-audio-player/

*/
(() => {
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

  // node_modules/webaudiofontplayer/dist/index.js
  var WebAudioFontPlayer = class {
    #audioCtx = null;
    #compressor = null;
    #preset = null;
    #envelopes = [];
    #afterTime = 0.05;
    #nearZero = 1e-6;
    #bendRange = 2;
    #mainGain = null;
    #volumeValue = 0.7;
    #expressionValue = 1;
    #expressionGain = null;
    #sustain = false;
    #pitchBendValue = 8192;
    #notesWaitingForSustain = /* @__PURE__ */ new Set();
    constructor(preset, audioCtx, compressor = null) {
      this.#audioCtx = audioCtx;
      this.#compressor = compressor;
      this.#preset = preset;
      this.#mainGain = this.#audioCtx.createGain();
      this.#mainGain.gain.setValueAtTime(this.#volumeValue, this.#audioCtx.currentTime);
      this.#expressionGain = this.#audioCtx.createGain();
      this.#expressionGain.gain.setValueAtTime(this.#expressionValue, this.#audioCtx.currentTime);
      this.#mainGain.connect(this.#expressionGain);
      this.#expressionGain.connect(this.#compressor ? this.#compressor.input : this.#audioCtx.destination);
      this.#preset.zones.map((zone) => this.#adjustZone(zone));
    }
    get preset() {
      return this.#preset;
    }
    set preset(preset) {
      this.#preset = preset;
      this.#preset.zones.map((zone) => this.#adjustZone(zone));
    }
    close() {
      const now = this.#audioCtx.currentTime;
      this.#envelopes.forEach((envelope) => {
        try {
          envelope.gain.cancelScheduledValues(0);
          if (envelope.audioBufferSourceNode) {
            envelope.audioBufferSourceNode.stop(now);
            envelope.audioBufferSourceNode.disconnect();
            envelope.audioBufferSourceNode = null;
          }
        } catch (e) {
        }
        try {
          envelope.disconnect();
        } catch (e) {
        }
      });
      this.#envelopes = [];
      this.#notesWaitingForSustain.clear();
      try {
        this.#mainGain.disconnect();
      } catch (e) {
      }
      try {
        this.#expressionGain.disconnect();
      } catch (e) {
      }
      this.#mainGain = null;
      this.#expressionGain = null;
      this.#preset = null;
      this.#compressor = null;
      this.#audioCtx = null;
    }
    queueWaveTable(when, pitch, duration, volume, slides) {
      if (this.#audioCtx.state === "suspended") this.#audioCtx.resume().catch(() => {
      });
      const vol = this.#limitVolume(volume);
      const zone = this.#findZone(Math.round(pitch));
      if (!zone?.buffer) return null;
      const baseDetuneCents = zone.originalPitch - 100 * zone.coarseTune - zone.fineTune;
      const originalPitchCents = pitch * 100;
      const currentBendCents = (this.#pitchBendValue - 8192) / 8192 * this.#bendRange * 100;
      const totalCents = originalPitchCents - baseDetuneCents + currentBendCents;
      const playbackRate = Math.pow(2, totalCents / 1200);
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
          const slidePitchCents = (pitch + s.delta) * 100;
          const totalSlideCents = slidePitchCents - baseDetuneCents + currentBendCents;
          const newRate = Math.pow(2, totalSlideCents / 1200);
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
      envelope.pitch = pitch;
      envelope.baseDetune = baseDetuneCents;
      return envelope;
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
    isSustainActive() {
      return this.#sustain;
    }
    registerSustainNote(cancelFn) {
      this.#notesWaitingForSustain.add(cancelFn);
    }
    setPitchBend(value) {
      this.#pitchBendValue = value;
      const normalized = value - 8192;
      const semitones = normalized >= 0 ? normalized / 8191 * this.#bendRange : normalized / 8192 * this.#bendRange;
      const now = this.#audioCtx.currentTime;
      this.#envelopes.forEach((e) => {
        if (e.audioBufferSourceNode && e.when + e.duration > now) {
          const originalPitchCents = e.pitch * 100;
          const baseDetuneCents = e.baseDetune;
          const bendCents = semitones * 100;
          const totalCents = originalPitchCents - baseDetuneCents + bendCents;
          const newRate = Math.pow(2, totalCents / 1200);
          e.audioBufferSourceNode.playbackRate.cancelScheduledValues(now);
          e.audioBufferSourceNode.playbackRate.setTargetAtTime(newRate, now, 0.015);
        }
      });
    }
    setController(number, value) {
      const now = this.#audioCtx.currentTime;
      const normalizedValue = Math.max(0, Math.min(127, value)) / 127;
      switch (number) {
        case 7:
          this.#volumeValue = normalizedValue;
          this.#mainGain.gain.setTargetAtTime(this.#volumeValue, now, 0.05);
          break;
        case 11:
          this.#expressionValue = normalizedValue;
          this.#expressionGain.gain.setTargetAtTime(this.#expressionValue, now, 0.03);
          break;
        case 64:
          this.#sustain = value >= 64;
          if (!this.#sustain) {
            this.#notesWaitingForSustain.forEach((cancelFn) => cancelFn());
            this.#notesWaitingForSustain.clear();
          }
          break;
      }
    }
    #adjustZone(zone) {
      if (zone.buffer) return Promise.resolve(zone);
      zone.delay = 0;
      if (zone.file) {
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
            console.warn(this.#preset);
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
    }
    #setupEnvelope(envelope, zone, volume, when, sampleDuration, noteDuration) {
      envelope.gain.setValueAtTime(this.#nearZero, this.#audioCtx.currentTime);
      const duration = Math.min(noteDuration, sampleDuration - this.#afterTime);
      const ahdsr = zone.ahdsr && zone.ahdsr.length > 0 ? zone.ahdsr : [
        { duration: 0, volume: 1 },
        { duration, volume: 1 }
      ];
      envelope.gain.cancelScheduledValues(when);
      const initialVol = (ahdsr[0]?.volume ?? 1) * volume;
      envelope.gain.linearRampToValueAtTime(this.#noZeroVolume(initialVol), when + 2e-3);
      let lastTime = 0;
      let lastVolume = ahdsr[0]?.volume ?? 1;
      for (const stage of ahdsr) {
        const { duration: stageDuration, volume: stageVolume } = stage;
        if (stageDuration <= 0) continue;
        const remainingTime = duration - lastTime;
        if (stageDuration > remainingTime) {
          const ratio = remainingTime / stageDuration;
          const interpolatedVolume = lastVolume + ratio * (stageVolume - lastVolume);
          envelope.gain.exponentialRampToValueAtTime(
            this.#noZeroVolume(volume * interpolatedVolume),
            when + duration
          );
          break;
        }
        lastTime += stageDuration;
        lastVolume = stageVolume;
        envelope.gain.exponentialRampToValueAtTime(
          this.#noZeroVolume(volume * lastVolume),
          when + lastTime
        );
      }
      envelope.gain.exponentialRampToValueAtTime(this.#nearZero, when + duration + this.#afterTime);
    }
    #findEnvelope(destinationNode) {
      const target = destinationNode || this.#mainGain;
      const now = this.#audioCtx.currentTime;
      let envelope = this.#envelopes.find((e) => e.target === target && now > e.when + e.duration + 0.05);
      if (!envelope && this.#envelopes.length >= 64) {
        const activeEnvelopes = this.#envelopes.filter((e) => e.target === target);
        if (activeEnvelopes.length > 0) {
          activeEnvelopes.sort((a, b) => a.when - b.when);
          envelope = activeEnvelopes[0];
        }
      }
      if (envelope) {
        if (envelope.audioBufferSourceNode) {
          try {
            envelope.audioBufferSourceNode.stop(0);
            envelope.audioBufferSourceNode.disconnect();
          } catch (e) {
          }
          envelope.audioBufferSourceNode = null;
        }
        envelope.gain.cancelScheduledValues(0);
        envelope.gain.setValueAtTime(this.#nearZero, now);
      } else {
        envelope = this.#audioCtx.createGain();
        envelope.gain.value = 0;
        envelope.target = target;
        envelope.connect(target);
        this.#envelopes.push(envelope);
      }
      envelope.cancel = (force = false) => {
        const currentTime = this.#audioCtx.currentTime;
        if (force && envelope.audioBufferSourceNode) {
          try {
            envelope.audioBufferSourceNode.stop(0);
            envelope.audioBufferSourceNode.disconnect();
          } catch (e) {
          }
          envelope.audioBufferSourceNode = null;
        }
        if (envelope.when + envelope.duration > currentTime) {
          envelope.gain.cancelScheduledValues(0);
          envelope.gain.setTargetAtTime(this.#nearZero, currentTime, force ? 5e-3 : 0.02);
          envelope.when = currentTime + 1e-5;
          envelope.duration = 0;
        }
      };
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
  if (typeof window !== "undefined") window.WebAudioFontPlayer = WebAudioFontPlayer;
  var index_default = WebAudioFontPlayer;

  // src/libraries/audiocompressor.js
  var AudioCompressor = class _AudioCompressor {
    #input = null;
    #output = null;
    #audioCtx = null;
    #limiter = null;
    #analyser = null;
    #reverbNode = null;
    #reverbWet = null;
    #currentReverbLevel = 0;
    #eqBands = /* @__PURE__ */ new Map();
    static #EQ_FREQUENCIES = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];
    static #EQ_Q = /* @__PURE__ */ new Map([
      [32, 0.7],
      [64, 0.8],
      [128, 0.9],
      [256, 1],
      [512, 1.1],
      [1024, 1.2],
      [2048, 1.4],
      [4096, 1.6],
      [8192, 1.8],
      [16384, 2]
    ]);
    constructor(audioCtx, volume, reverb) {
      this.#audioCtx = audioCtx;
      this.#input = this.#audioCtx.createGain();
      let lastNode = this.#input;
      const frequencies = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];
      frequencies.forEach((freq) => {
        lastNode = this.#bandEqualizer(lastNode, freq);
        const label = freq < 1e3 ? freq : freq / 1024 + "k";
        this["band".concat(label)] = lastNode;
      });
      this.#currentReverbLevel = reverb;
      this.#reverbNode = this.#audioCtx.createConvolver();
      this.#reverbWet = this.#audioCtx.createGain();
      this.#reverbWet.gain.setValueAtTime(reverb, this.#audioCtx.currentTime);
      this.#generateImpulseResponse(1.5, 2);
      this.#limiter = this.#audioCtx.createDynamicsCompressor();
      this.#limiter.threshold.setValueAtTime(-10, this.#audioCtx.currentTime);
      this.#limiter.ratio.setValueAtTime(20, this.#audioCtx.currentTime);
      this.#limiter.attack.setValueAtTime(1e-3, this.#audioCtx.currentTime);
      this.#limiter.release.setValueAtTime(0.1, this.#audioCtx.currentTime);
      this.#limiter.knee.setValueAtTime(0, this.#audioCtx.currentTime);
      this.#analyser = this.#audioCtx.createAnalyser();
      this.#analyser.fftSize = 256;
      this.#analyser.smoothingTimeConstant = 0.6;
      this.#output = this.#audioCtx.createGain();
      this.#output.gain.setValueAtTime(volume, this.#audioCtx.currentTime);
      lastNode.connect(this.#output);
      this.#output.connect(this.#limiter);
      this.#output.connect(this.#reverbNode);
      this.#reverbNode.connect(this.#reverbWet);
      this.#limiter.connect(this.#analyser);
      this.#reverbWet.connect(this.#analyser);
      this.#analyser.connect(this.#audioCtx.destination);
    }
    get eqFrequencies() {
      return _AudioCompressor.#EQ_FREQUENCIES;
    }
    get analyser() {
      return this.#analyser || null;
    }
    get input() {
      return this.#input;
    }
    get reverb() {
      return this.#currentReverbLevel;
    }
    set reverb(value) {
      this.#currentReverbLevel = Math.max(0, Math.min(1, value));
      this.#reverbWet.gain.setTargetAtTime(this.#currentReverbLevel, this.#audioCtx.currentTime, 0.1);
    }
    get masterVolume() {
      return this.#output.gain.value;
    }
    set masterVolume(value) {
      const linearValue = Math.max(0, Math.min(1, value));
      const logVolume = Math.pow(linearValue, 2);
      this.#output.gain.setTargetAtTime(logVolume, this.#audioCtx.currentTime, 0.01);
    }
    killReverbTail() {
      const now = this.#audioCtx.currentTime;
      this.#reverbWet.gain.cancelScheduledValues(now);
      this.#reverbWet.gain.setValueAtTime(0, now);
    }
    restoreReverb() {
      this.reverb = this.#currentReverbLevel;
    }
    setEQ(gains, smoothTime = 0.04) {
      const now = this.#audioCtx.currentTime;
      const MAX_DB = 12;
      for (const [key, val] of Object.entries(gains)) {
        const freq = Number(key);
        const band = this.#eqBands.get(freq);
        if (!band) continue;
        const dbValue = Math.max(-MAX_DB, Math.min(MAX_DB, val));
        band.filter.gain.setTargetAtTime(dbValue, now, smoothTime);
        band.gain = dbValue;
      }
    }
    getEQ() {
      const result = {};
      for (const [freq, band] of this.#eqBands) result[freq] = band.gain;
      return result;
    }
    resetEQ(smoothTime = 0.04) {
      const flat = {};
      for (const freq of _AudioCompressor.#EQ_FREQUENCIES) flat[freq] = 0;
      this.setEQ(flat, smoothTime);
    }
    setEQPreset(name) {
      const presets = {
        flat: { 32: 0, 64: 0, 128: 0, 256: 0, 512: 0, 1024: 0, 2048: 0, 4096: 0, 8192: 0, 16384: 0 },
        bass: { 32: 7, 64: 6, 128: 4, 256: 2, 512: 0, 1024: -1, 2048: -1, 4096: 0, 8192: 0, 16384: 0 },
        treble: { 32: 0, 64: 0, 128: 0, 256: 0, 512: 0, 1024: 1, 2048: 3, 4096: 5, 8192: 7, 16384: 8 },
        vocal: { 32: -3, 64: -2, 128: 0, 256: 2, 512: 4, 1024: 5, 2048: 4, 4096: 2, 8192: 1, 16384: 0 },
        loudness: { 32: 6, 64: 4, 128: 1, 256: 0, 512: -1, 1024: -1, 2048: 0, 4096: 2, 8192: 4, 16384: 5 },
        classical: { 32: 4, 64: 3, 128: 2, 256: 0, 512: 0, 1024: 0, 2048: 0, 4096: 2, 8192: 3, 16384: 4 },
        jazz: { 32: 4, 64: 3, 128: 1, 256: 0, 512: -1, 1024: -1, 2048: 0, 4096: 1, 8192: 3, 16384: 4 },
        electronic: { 32: 6, 64: 5, 128: 2, 256: -1, 512: -2, 1024: -1, 2048: 2, 4096: 4, 8192: 5, 16384: 6 }
      };
      const preset = presets[name];
      if (!preset) throw new Error('Preset EQ unkown: "'.concat(name, '". Avaiables: ').concat(Object.keys(presets).join(", ")));
      this.setEQ(preset);
    }
    #bandEqualizer(from, frequency) {
      const filter = this.#audioCtx.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.setValueAtTime(frequency, this.#audioCtx.currentTime);
      filter.gain.setValueAtTime(0, this.#audioCtx.currentTime);
      const q = _AudioCompressor.#EQ_Q.get(frequency) ?? 1;
      filter.Q.setValueAtTime(q, this.#audioCtx.currentTime);
      this.#eqBands.set(frequency, { filter, gain: 0 });
      from.connect(filter);
      return filter;
    }
    #generateImpulseResponse(duration, decay) {
      const sampleRate = this.#audioCtx.sampleRate;
      const length = sampleRate * duration;
      const impulse = this.#audioCtx.createBuffer(2, length, sampleRate);
      const preDelayTime = 0.015;
      const preDelaySamples = Math.floor(preDelayTime * sampleRate);
      for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
        const data = impulse.getChannelData(channel);
        let lastValue = 0;
        const channelOffset = channel === 1 ? Math.floor(2e-3 * sampleRate) : 0;
        for (let i = 0; i < length; i++) {
          if (i < preDelaySamples) {
            data[i] = 0;
            continue;
          }
          const t = (i - preDelaySamples) / sampleRate;
          const envelope = Math.exp(-t * (decay / duration));
          const dampingFactor = Math.max(0.01, 0.2 * Math.exp(-t * 2.5));
          const whiteNoise = Math.random() * 2 - 1;
          lastValue = whiteNoise * dampingFactor + lastValue * (1 - dampingFactor);
          let sampleValue = lastValue * envelope;
          if (t < 0.04) {
            if (i % 123 === 0 || i % 234 === 0) {
              sampleValue += (Math.random() * 2 - 1) * 0.2 * (0.04 - t) / 0.04;
            }
          }
          if (i + channelOffset < length) data[i + channelOffset] = sampleValue;
          else data[i] = sampleValue;
        }
      }
      this.#reverbNode.buffer = impulse;
    }
  };

  // src/libraries/indexeddbstorage.js
  var DB_NAME = "MidiAudioPlayer";
  var STORE_NAME = "KeyValues";
  var DEFAULT_VERSION = 1;
  var dbInstance = null;
  var currentVersion = DEFAULT_VERSION;
  async function getDB(version = currentVersion) {
    if (dbInstance && version !== currentVersion) {
      dbInstance.close();
      dbInstance = null;
      currentVersion = version;
    }
    if (dbInstance) return dbInstance;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, version);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e) => {
        dbInstance = e.target.result;
        resolve(dbInstance);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }
  var indexedDbStorage = {
    async setVersion(version) {
      await getDB(version);
    },
    async setItem(key, value, compress = false) {
      const db = await getDB();
      let finalData = value;
      let isCompressed = false;
      if (compress) {
        const stringData = JSON.stringify(value);
        const stream = new Blob([stringData]).stream();
        const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
        const response = new Response(compressedStream);
        finalData = await response.arrayBuffer();
        isCompressed = true;
      }
      const record = { data: finalData, isCompressed };
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(record, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
    async getItem(key) {
      const db = await getDB();
      const record = await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      if (!record) return null;
      if (record.isCompressed) {
        const stream = new Blob([record.data]).stream();
        const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
        const response = new Response(decompressedStream);
        const text = await response.text();
        return JSON.parse(text);
      }
      return record.data;
    },
    async removeItem(key) {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
    async clear() {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  };
  var indexeddbstorage_default = indexedDbStorage;

  // src/midiaudioplayer.js
  var clamp = (num, min, max) => Math.min(Math.max(num, min), max);
  var MidiAudioPlayer = class _MidiAudioPlayer extends index.Player {
    static ENDPOINT = "https://webaudiofonts.com/presets/";
    static DEFAULT_PRESET = -1;
    static REFERENCE_GAIN = 0.15;
    static KARAOKE_CHANNEL = 0;
    #catalog = null;
    #audioCtx = null;
    #compressor = null;
    #vocalChannel = null;
    #activeNotes = {};
    #channelStates = {};
    #instruments = {};
    #players = {};
    #channels = {};
    #channelVolumes = {};
    #presetMap = {};
    #bufferHash = null;
    #presetTimer = null;
    #presetMapThread = null;
    #lyrics = null;
    #haveLyrics = false;
    #title = "";
    #opts = {
      endpoint: _MidiAudioPlayer.ENDPOINT,
      volume: 0.6,
      reverb: 0.3,
      onEndFile: null,
      localCache: true,
      presetRandom: false,
      karaoke: false,
      karaokeDelay: 0,
      muteExpression: false,
      maxCharPerLine: 48,
      eqPreset: "flat",
      preferred: [],
      presets: []
    };
    constructor(opts = {}) {
      super();
      this.#opts = { ...this.#opts, ...opts };
      this.#presetMapThread = this.#mapPresets();
      this.#audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.#compressor = new AudioCompressor(this.#audioCtx, this.#opts.volume, this.#opts.reverb);
      this.#compressor.setEQPreset(this.#opts.eqPreset);
      if (this.#opts.karaoke) this.#sendKaraokeFrame("intro");
    }
    get catalog() {
      return this.getCatalog();
    }
    get channels() {
      return this.#players;
    }
    get channelStates() {
      return this.#channelStates;
    }
    get volume() {
      return this.#opts.volume;
    }
    set volume(vol) {
      this.#opts.volume = clamp(vol, 0, 1);
      this.#compressor.masterVolume = this.#opts.volume;
    }
    get volumes() {
      return this.#channelVolumes;
    }
    get reverb() {
      return this.#compressor.reverb;
    }
    set reverb(rev) {
      this.#compressor.reverb = rev;
    }
    get muteExpression() {
      return this.#opts.muteExpression;
    }
    set muteExpression(val) {
      this.#opts.muteExpression = Boolean(val);
    }
    get eqFrequencies() {
      return this.#compressor.eqFrequencies;
    }
    get eq() {
      return this.#compressor.getEQ();
    }
    getEQ() {
      return this.#compressor.getEQ();
    }
    setEQ(gains) {
      this.#compressor.setEQ(gains);
    }
    setEQPreset(name) {
      this.#compressor.setEQPreset(name);
    }
    setChannelVolume(channel, volume) {
      this.#channelVolumes[channel] = volume;
      this.#setupChange();
    }
    async #mapPresets() {
      await Promise.all(this.#opts.presets.map(async (p) => {
        const preset = await this.findPreset(p);
        if (preset) this.#presetMap[preset.program] = preset;
      }));
    }
    async findPreset(id) {
      let preset = null;
      const categories = await this.getCategories();
      categories.some((c) => {
        c.instruments.some((i) => {
          preset = i.presets.find((p) => p.id == id);
          if (preset) {
            preset.category = c.name;
            preset.instrument = i.name;
            preset.program = i.program;
            return true;
          }
        });
        if (preset) return true;
      });
      return preset;
    }
    async close() {
      Object.keys(this.#players).forEach((id) => this.#players[id].close());
      await this.#audioCtx.close();
    }
    async getCatalog() {
      if (this.#catalog) return this.#catalog;
      const cachedata = this.#opts.localCache ? await sessionStorage.getItem("waf_catalog") : null;
      if (cachedata) this.#catalog = JSON.parse(cachedata);
      else {
        this.#log("Downloading catalog...");
        const response = await fetch("".concat(this.#opts.endpoint, "catalog.json"));
        if (!response.ok) throw new Error("Impossible to download catalog: ".concat(response.status));
        this.#catalog = await response.json();
        if (this.#opts.localCache) await sessionStorage.setItem("waf_catalog", JSON.stringify(this.#catalog));
      }
      const catalogDate = new Date(this.#catalog.updatedAt).getTime();
      const catalogVersion = await indexeddbstorage_default.getItem("waf_catalog_version") || 1;
      if (catalogVersion < catalogDate) {
        await indexeddbstorage_default.clear();
        indexeddbstorage_default.setItem("waf_catalog_version", catalogDate);
      }
      return this.#catalog;
    }
    async getCategories() {
      return (await this.getCatalog()).categories;
    }
    async getProgramInstruments(program) {
      const categories = await this.getCategories();
      let instruments = [];
      await Promise.all(categories.map(async (category) => category.instruments.filter((elm) => elm.program == program).forEach((elm) => {
        elm.presets.forEach((p) => {
          p.instrument = category.name + " / " + elm.name;
          instruments.push(p);
        });
      })));
      return instruments;
    }
    async getPreset(id) {
      try {
        if (typeof id === "object") return id;
        const cacheid = "waf_preset_".concat(id);
        const cachedata = this.#opts.localCache ? await indexeddbstorage_default.getItem(cacheid) : null;
        if (cachedata) return JSON.parse(cachedata);
        this.#log("Downloading preset ".concat(id, "..."));
        const response = await fetch("".concat(_MidiAudioPlayer.ENDPOINT).concat(id, ".json"));
        const preset = await response.json();
        if (preset.zones === void 0) {
          console.error("Invalid preset: ".concat($id));
          throw new Error("Invalid preset: ".concat($id));
        }
        if (this.#opts.localCache) await indexeddbstorage_default.setItem(cacheid, JSON.stringify(preset), true);
        return preset;
      } catch (e) {
        console.error("Invalid preset: ".concat(id));
        throw new Error("Invalid preset: ".concat(id));
      }
    }
    async loadPreset(presetId, channel) {
      const presetInfo = await this.findPreset(presetId);
      if (!presetInfo) throw new Error("Invalid preset: ".concat(presetId));
      this.#presetMap[presetInfo.program] = presetInfo;
      const preset = await this.getPreset(presetId);
      this.#players[channel].preset = preset;
      this.#setupChange();
    }
    async load(content, setup) {
      if (typeof content === "string") {
        this.#log("Downloading song...");
        const response = await fetch(content);
        content = await response.arrayBuffer();
      }
      if (typeof setup === "string") {
        this.#log("Downloading setup...");
        const response = await fetch(setup);
        setup = await response.json();
      }
      this.#bufferHash = await this.hashBuffer(content);
      await this.#presetMapThread;
      if (this.isPlaying()) this.stop();
      this.#clearActiveNotes();
      await Promise.all(Object.values(this.#players).map(async (player) => player.close()));
      this.#players = {};
      this.#instruments = {};
      this.#activeNotes = {};
      this.#title = "";
      this.#log("Loading buffer...");
      try {
        await this.loadArrayBuffer(content);
      } catch (e) {
        await this.loadArrayBuffer(await this.#repairMidi(content));
      }
      this.#log("Loading instruments...");
      this.#channels = await this.#getInstruments();
      this.#channelStates = Object.keys(this.#channels).reduce((acc, key) => ({ ...acc, [key]: false }), {});
      this.#channelVolumes = Object.keys(this.#channels).reduce((acc, key) => ({ ...acc, [key]: 1 }), {});
      if (setup?.volumes !== void 0) {
        await Promise.all(Object.keys(setup.volumes).map(async (channel) => {
          if (this.#channelVolumes[channel] === void 0) return;
          this.#channelVolumes[channel] = setup.volumes[channel];
        }));
      }
      const setupPrograms = /* @__PURE__ */ new Set();
      const setupPresets = {};
      if (setup?.presets !== void 0) {
        await Promise.all(Object.keys(setup.presets).map(async (channel) => {
          const presetInfo = await this.findPreset(setup.presets[channel]);
          if (!presetInfo) return;
          setupPresets[channel] = await this.getPreset(presetInfo.id);
          setupPrograms.add(presetInfo.program);
        }));
      }
      const uniqueInstruments = await this.#getUniqueInstruments();
      if (!Object.values(this.#channels).length) this.#log("Error: no instrument found");
      const presets = Promise.all([...uniqueInstruments].map(async (program) => {
        if (setupPrograms.has(program)) return;
        let preset = null;
        if (this.#presetMap[program] !== void 0) preset = await this.getPreset(this.#presetMap[program].id);
        else if (this.#opts.presetRandom) preset = await this.#getRandomPreset(program);
        else preset = await this.#getAutoPreset(program);
        this.#instruments[program] = preset;
      }));
      if (this.#opts.karaoke) {
        this.#log("Generating karaoke frames...");
        this.#lyrics = null;
        await this.#generateKaraokeFrames();
        if (this.#title) this.#sendKaraokeFrame("title", this.#title);
      }
      this.#log("Trim midi events...");
      this.#trimMidiEvents();
      queueMicrotask(() => this.triggerPlayerEvent("computed"));
      await presets;
      await Promise.all(Object.keys(this.#channels).map(async (channel) => {
        if (this.#players[channel]) this.#players[channel].close();
        if (setupPresets[channel] !== void 0) this.#players[channel] = await this.#createPlayer(setupPresets[channel]);
        else this.#players[channel] = await this.#createPlayer(this.#instruments[this.#channels[channel]]);
      }));
      this.#log("Initializing instrument states...");
      await this.#initInstrumentStates();
      await this.triggerPlayerEvent("presetsLoaded", this.#instruments);
      await this.#setupChange();
      this.#log("Player ready");
    }
    async getSongSetup() {
      let setup = { hash: this.#bufferHash, presets: {}, volumes: {} };
      Object.keys(this.#players).map(async (channel) => setup.presets[channel] = this.#players[channel].preset.id);
      setup.volumes = this.#channelVolumes;
      return setup;
    }
    async getTrainingPresets() {
      return await Promise.all(Object.values(this.#presetMap).map(async (preset) => preset.id));
    }
    async play(content = null) {
      if (this.#audioCtx.state === "suspended") {
        try {
          await this.#audioCtx.resume();
        } catch (e) {
          return false;
        }
      }
      if (content) await this.load(content);
      await Promise.all(Object.keys(this.#players).map(async (k) => await this.#players[k]?.cancelQueue()));
      this.#compressor.restoreReverb();
      if (!this.isPlaying()) {
        if (!this.startTime) this.startTime = (/* @__PURE__ */ new Date()).getTime();
        this.scheduledTime = Date.now();
        this.schedulePlayLoop(this.sampleRate);
      }
      return true;
    }
    async pause() {
      await super.pause();
      this.#compressor.killReverbTail();
      await this.#clearActiveNotes();
      await Promise.all(Object.keys(this.#players).map(async (k) => await this.#players[k]?.cancelQueue()));
    }
    async stop(skipKill = false) {
      await super.stop();
      this.setTimeoutId = false;
      if (!skipKill) {
        this.#compressor.killReverbTail();
        await Promise.all(Object.keys(this.#players).map(async (k) => await this.#players[k]?.cancelQueue()));
      }
      await this.#clearActiveNotes();
      if (this.#opts.karaoke) this.#sendKaraokeFrame("intro");
      return this;
    }
    getRealTimeVolume() {
      const analyser = this.#compressor.analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      let values = 0;
      for (let i = 0; i < dataArray.length; i++) values += dataArray[i];
      return values / (dataArray.length * 100);
    }
    getSongTimeRemaining() {
      return this.ticksToSeconds(this.getCurrentTick(), this.totalTicks);
    }
    async skipToSeconds(seconds) {
      const songTime = this.getSongTime();
      if (seconds < 0 || seconds > songTime) throw seconds + " seconds not within song time of " + songTime;
      await this.skipToTick(this.secondsToTicks(seconds));
      return this;
    }
    async generateWaveformSVG(samples = 1e3) {
      if (!this.totalTicks || !this.events) return "";
      const waveform = new Array(samples).fill(0);
      const tickInterval = this.totalTicks / samples;
      const allEvents = this.events.flatMap(
        (track, trackIdx) => track.map((event) => ({
          ...event,
          computedChannel: event.channel !== void 0 ? event.channel : trackIdx
        }))
      ).filter(
        (event) => event.name === "Controller Change" || event.name === "Program Change" || event.name === "Note on" && event.velocity > 0
      ).sort((a, b) => a.tick - b.tick);
      const channelsVolume = /* @__PURE__ */ new Map();
      const channelsExpression = /* @__PURE__ */ new Map();
      allEvents.forEach((event) => {
        const idx = Math.floor(event.tick / tickInterval);
        if (idx >= samples) return;
        const chan = event.computedChannel;
        if (!channelsVolume.has(chan)) channelsVolume.set(chan, 100);
        if (!channelsExpression.has(chan)) channelsExpression.set(chan, 127);
        if (event.name === "Controller Change") {
          if (event.number === 7) channelsVolume.set(chan, event.value);
          else if (event.number === 11) channelsExpression.set(chan, event.value);
        } else if (event.name === "Note on") {
          const volFactor = channelsVolume.get(chan) / 127;
          const expFactor = channelsExpression.get(chan) / 127;
          const modulatedVelocity = event.velocity * volFactor * expFactor;
          waveform[idx] += modulatedVelocity;
        }
      });
      const maxAmp = waveform.reduce((max, val) => {
        if (isNaN(val)) return max;
        return val > max ? val : max;
      }, 0);
      const normalized = maxAmp > 0 ? waveform.map((v) => isNaN(v) ? 0 : v / maxAmp) : waveform.fill(0);
      const width = samples;
      const height = width / 5;
      const points = normalized.map((val, i) => {
        const x = i;
        const y = Math.max(0, Math.min(height, height - val * height));
        return "".concat(x, ",").concat(y.toFixed(2));
      });
      const d = "M 0,".concat(height, " L ").concat(points.join(" L "), " L ").concat(width, ",").concat(height);
      return '<svg class="midiaudioplayer-waveform" viewBox="0 0 '.concat(width, " ").concat(height, '" preserveAspectRatio="none"><path d="').concat(d, '" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>');
    }
    // ----------------------------------------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------------------------------------
    async hashBuffer(arrayBuffer, algorithm = "SHA-256") {
      const hashBuffer = await crypto.subtle.digest(algorithm, arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    async #setupChange() {
      if (this.#presetTimer) clearTimeout(this.#presetTimer);
      this.#presetTimer = setTimeout(async () => {
        const setup = await this.getSongSetup();
        queueMicrotask(() => this.triggerPlayerEvent("setupChange", setup));
      }, 1e3);
    }
    async triggerPlayerEvent(playerEvent, data) {
      if (playerEvent == "fileLoaded") return;
      else if (playerEvent == "computed") {
        this.#vocalChannel = await this.#detectKaraokeVocalChannel();
        super.triggerPlayerEvent(playerEvent, {
          title: this.#title,
          karaoke: this.#haveLyrics,
          vocalChannel: this.#vocalChannel,
          tempo: this.tempo,
          division: this.division,
          duration: this.getSongTime(),
          sampleRate: this.sampleRate,
          totalTicks: this.totalTicks,
          totalEvents: this.totalEvents,
          channels: await this.#channels
        });
      } else if (playerEvent == "endOfFile" && this.#opts.karaoke) {
        queueMicrotask(() => super.triggerPlayerEvent(playerEvent, data));
      } else super.triggerPlayerEvent(playerEvent, data);
    }
    async playLoop(dryRun) {
      if (this.inLoop) return;
      if (!dryRun && this.endOfFile() && this.tick > 0) {
        await this.stop(true);
        this.tick = 0;
        this.triggerPlayerEvent("endOfFile");
        return;
      }
      this.inLoop = true;
      this.tick = this.getCurrentTick();
      const tracksLen = this.tracks.length;
      for (let i = 0; i < tracksLen; i++) {
        const result = this.tracks[i].handleEvent(this.tick, dryRun);
        if (!result) continue;
        const isArray = result.constructor === Array;
        const eventsLen = isArray ? result.length : 1;
        for (let j = 0; j < eventsLen; j++) {
          const event = isArray ? result[j] : result;
          const { name, data, value } = event;
          if (name === "Set Tempo") this.setTempo(data);
          if (dryRun) {
            if (name === "Program Change" && !this.instruments.includes(value)) this.instruments.push(value);
          } else {
            this.emitEvent(event);
          }
        }
      }
      if (!dryRun && this.isPlaying()) this.triggerPlayerEvent("playing", { tick: this.tick });
      this.inLoop = false;
    }
    schedulePlayLoop(delay) {
      this.setTimeoutId = setTimeout(() => {
        if (this.setTimeoutId === false) return;
        this.playLoop();
        const currentAudioTime = this.#audioCtx.currentTime;
        if (!this._lastAudioTime) this._lastAudioTime = currentAudioTime;
        const elapsed = currentAudioTime - this._lastAudioTime;
        this._lastAudioTime = currentAudioTime;
        const sampleRateSec = this.sampleRate / 1e3;
        const drift = elapsed - sampleRateSec;
        const nextDelay = Math.max(0, this.sampleRate - drift * 1e3);
        this.schedulePlayLoop(nextDelay);
      }, delay);
    }
    emitEvent(event) {
      this.#handleMidiPipeline(event);
    }
    ticksToSeconds(startTick, endTick) {
      if (endTick === void 0) {
        endTick = startTick;
        startTick = 0;
      }
      if (startTick >= endTick) return 0;
      let seconds = 0;
      const len = this.tempoMap.length;
      const timeFactor = 60 / this.division;
      let low = 0;
      let high = len - 1;
      let startIndex = 0;
      while (low <= high) {
        const mid = low + high >> 1;
        if (this.tempoMap[mid].tick <= startTick) {
          startIndex = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      let currentTick = startTick;
      for (let i = startIndex; i < len; i++) {
        const entry = this.tempoMap[i];
        const nextTick = i + 1 < len ? this.tempoMap[i + 1].tick : endTick;
        if (nextTick <= startTick) continue;
        const segStart = Math.max(entry.tick, startTick);
        const segEnd = Math.min(nextTick, endTick);
        if (segStart >= endTick) break;
        seconds += (segEnd - segStart) / entry.tempo * timeFactor;
        currentTick = segEnd;
      }
      if (currentTick < endTick) {
        const lastEntry = this.tempoMap[len - 1];
        seconds += (endTick - currentTick) / lastEntry.tempo * timeFactor;
      }
      return seconds;
    }
    secondsToTicks(seconds) {
      let remainingSeconds = seconds;
      const len = this.tempoMap.length;
      const factor = 60 / this.division;
      for (let i = 0; i < len; i++) {
        const entry = this.tempoMap[i];
        const nextTick = i + 1 < len ? this.tempoMap[i + 1].tick : Infinity;
        const segmentTicks = nextTick - entry.tick;
        const segmentSeconds = segmentTicks / entry.tempo * factor;
        if (remainingSeconds <= segmentSeconds) {
          return entry.tick + Math.round(remainingSeconds * entry.tempo / factor);
        }
        remainingSeconds -= segmentSeconds;
      }
      return this.totalTicks;
    }
    getTickBeforeSeconds(targetTick, seconds) {
      if (targetTick <= 0) return 0;
      const targetTime = this.ticksToSeconds(0, targetTick);
      const desiredTime = Math.max(0, targetTime - seconds);
      return this.secondsToTicks(desiredTime);
    }
    async skipToTick(tick) {
      const safeTick = Math.max(0, Math.min(tick, this.totalTicks || 0));
      const wasPlaying = this.isPlaying();
      this.#clearActiveNotes();
      Object.keys(this.channels).forEach((k) => this.channels[k]?.cancelQueue?.());
      if (wasPlaying) super.pause();
      this.startTick = safeTick;
      this.tick = safeTick;
      if (this.tempoMap && this.tempoMap.length > 0) {
        for (let i = this.tempoMap.length - 1; i >= 0; i--) {
          if (this.tempoMap[i].tick <= safeTick) {
            this.setTempo(this.tempoMap[i].tempo);
            break;
          }
        }
      }
      try {
        const controllerChange = [];
        const programChange = [];
        const pitchBend = [];
        const karaokeEvent = [];
        this.#collectStateAtTick(safeTick).forEach((event) => {
          const channel = event.channel;
          if ((channel === void 0 || !this.channels[channel]) && event.name !== "Karaoke Event") return;
          switch (event.name) {
            case "Controller Change":
              controllerChange[event.channel] = event;
              break;
            case "Program Change":
              programChange[event.channel] = event;
              break;
            case "Pitch Bend":
              pitchBend[event.channel] = event;
              break;
            case "Karaoke Event":
              karaokeEvent[event.channel] = event;
              break;
          }
        });
        controllerChange.forEach((evt) => this.emitEvent(evt));
        programChange.forEach((evt) => this.emitEvent(evt));
        pitchBend.forEach((evt) => this.emitEvent(evt));
        karaokeEvent.forEach((evt) => this.triggerPlayerEvent("karaoke", { type: evt.type, tick: evt.tick, html: evt.text }));
      } catch (e) {
        console.warn("Chase MIDI Error:", e);
        this.#log("Chase MIDI Error:", e);
      }
      if (this.tracks && this.tracks.length > 0) {
        this.tracks.forEach((track, index2) => {
          const trackEvents = this.events[index2];
          if (trackEvents && trackEvents.length > 0) {
            let low = 0;
            let high = trackEvents.length - 1;
            let pointer = trackEvents.length;
            while (low <= high) {
              const mid = low + high >> 1;
              if (trackEvents[mid].tick >= safeTick) {
                pointer = mid;
                high = mid - 1;
              } else {
                low = mid + 1;
              }
            }
            track.eventIndex = pointer;
          } else if (typeof track.setEventIndexByTick === "function") {
            track.setEventIndexByTick(safeTick);
          }
        });
      }
      if (wasPlaying) this.play();
      else this.triggerPlayerEvent("playing", { tick: safeTick });
      return this;
    }
    #collectStateAtTick(tick) {
      const dominated = {};
      if (!this.events) return [];
      for (let t = 0; t < this.events.length; t++) {
        const trackEvents = this.events[t];
        if (!trackEvents || trackEvents.length === 0) continue;
        let low = 0;
        let high = trackEvents.length - 1;
        let endIdx = trackEvents.length;
        while (low <= high) {
          const mid = low + high >> 1;
          if (trackEvents[mid].tick >= tick) {
            endIdx = mid;
            high = mid - 1;
          } else {
            low = mid + 1;
          }
        }
        for (let i = 0; i < endIdx; i++) {
          const event = trackEvents[i];
          let key;
          if (event.name === "Program Change") {
            key = "pc:" + event.channel;
          } else if (event.name === "Controller Change") {
            key = "cc:" + event.channel + ":" + event.number;
          } else if (event.name === "Pitch Bend") {
            key = "pb:" + event.channel;
          } else if (event.name === "Karaoke Event") {
            key = "ke:" + event.channel;
          }
          if (key) {
            dominated[key] = event;
          }
        }
      }
      return Object.keys(dominated).map((key) => dominated[key]);
    }
    async #initInstrumentStates() {
      if (this.events) {
        this.#collectStateAtTick(1).forEach((event) => {
          const channel = event.channel;
          if (!this.#players[channel]) return;
          switch (event.name) {
            case "Controller Change":
              this.#players[channel].setController(event.number, event.value);
              break;
            case "Pitch Bend":
              this.#players[channel].setPitchBend?.(event.value);
              break;
            case "Program Change":
              if (
                // (this.#opts.presetAuto || this.#opts.presetRandom) &&
                event.value >= 0 && event.value <= 127 && this.#instruments[event.value + 1] !== void 0 && event.channel != 10
              ) {
                if (this.#players[channel].preset?.program !== event.value + 1) {
                  this.#players[channel].preset = this.#instruments[event.value + 1];
                }
              }
              break;
          }
        });
      }
    }
    async #getInstruments() {
      const instrumentMap = {};
      const channelUsed = /* @__PURE__ */ new Set();
      this.events.forEach((track) => {
        track.forEach((event) => {
          if (event.name === "Program Change" && event.value >= 0 && event.value <= 127) {
            if (instrumentMap[event.channel]) return;
            else if (event.channel == 10) instrumentMap[event.channel] = -1;
            else instrumentMap[event.channel] = event.value + 1;
          } else if (event.name === "Note on" && event.channel == 10) {
            instrumentMap[event.channel] = -1;
            channelUsed.add(10);
          } else if (event.name === "Note on") {
            channelUsed.add(event.channel);
          }
        });
      });
      Object.keys(instrumentMap).forEach((channel) => {
        if (!channelUsed.has(Number(channel))) delete instrumentMap[channel];
      });
      return instrumentMap;
    }
    async #getUniqueInstruments() {
      const instrumentMap = /* @__PURE__ */ new Set();
      this.events.forEach((track) => {
        track.forEach((event) => {
          if (event.name === "Program Change" && event.value >= 0 && event.value <= 127) {
            instrumentMap.add(event.channel == 10 ? -1 : event.value + 1);
          } else if (event.name === "Note on" && event.channel == 10) instrumentMap.add(-1);
        });
      });
      return instrumentMap;
    }
    async #getRandomPreset(program) {
      const instruments = await this.getProgramInstruments(program);
      if (!instruments.length) return null;
      let preset = null;
      this.#opts.preferred.some((bank) => {
        const regex = new RegExp("_".concat(bank, "$"), "i");
        const group = instruments.filter((i) => regex.test(i.id));
        if (group.length) {
          preset = group[Math.floor(Math.random() * group.length)];
          return true;
        }
      });
      if (!preset) preset = instruments[Math.floor(Math.random() * instruments.length)];
      this.#presetMap[program] = preset;
      return await this.getPreset(preset.id);
    }
    async #getAutoPreset(program) {
      const instruments = await this.getProgramInstruments(program);
      if (!instruments.length) return null;
      let preset = null;
      this.#opts.preferred.some((bank) => {
        const regex = new RegExp("_".concat(bank, "$"), "i");
        preset = instruments.find((i) => regex.test(i.id));
        if (preset) return true;
      });
      if (!preset) preset = instruments[0];
      this.#presetMap[program] = preset;
      return await this.getPreset(preset.id);
    }
    async #createPlayer(preset) {
      return new index_default(preset, this.#audioCtx, this.#compressor);
    }
    async #handleMidiPipeline(event) {
      if (!this.isPlaying()) return;
      switch (event.name) {
        case "Note on":
          if (event.tick < this.tick - 100) return;
          if (event.noteNumber === void 0) return;
          if (event.channel == this.#vocalChannel && this.#opts.muteExpression) return;
          if (event.velocity > 0 && event.velocity <= 127) {
            this.#stopNote(event.channel, event.noteNumber);
            if (this.#channelVolumes[event.channel] == 0) return;
            const noteVelocityRatio = event.velocity / 127;
            const finalVol = _MidiAudioPlayer.REFERENCE_GAIN * Math.pow(noteVelocityRatio, 2) * this.#channelVolumes[event.channel];
            const envelope = this.#players[event.channel]?.queueWaveTable(0, event.noteNumber, 2, finalVol);
            if (envelope) this.#addNote(event.channel, event.noteNumber, envelope);
          } else {
            this.#stopNote(event.channel, event.noteNumber);
          }
          break;
        case "Note off":
          if (event.noteNumber === void 0) return;
          this.#stopNote(event.channel, event.noteNumber);
          break;
        case "Controller Change":
          this.#players[event.channel]?.setController(event.number, event.value);
          break;
        case "Pitch Bend":
          this.#players[event.channel]?.setPitchBend?.(event.value);
          break;
        case "Program Change":
          return;
          if (!this.#players[event.channel]) return;
          if (event.channel == 10 || event.value > 127 || event.value < 0) break;
          if (this.#players[event.channel] !== void 0 && this.#players[event.channel].preset.program != event.value + 1)
            this.#players[event.channel].preset = this.#instruments[event.value + 1];
          break;
        case "Karaoke Event":
          if (event.tick < this.tick - this.secondsToTicks(10)) return;
          this.triggerPlayerEvent("karaoke", { type: event.type, tick: event.tick, html: event.text });
          break;
      }
    }
    #addNote(channel, note, envelope) {
      if (!this.#activeNotes[channel]) this.#activeNotes[channel] = /* @__PURE__ */ new Map();
      this.#activeNotes[channel].set(note, envelope);
      this.#updateChannelStates();
      const realDurationMs = (envelope.duration || 0) * 1e3;
      envelope.cleanupTimer = setTimeout(() => {
        if (this.#activeNotes[channel]?.get(note) === envelope) {
          this.#activeNotes[channel].delete(note);
          this.#updateChannelStates();
        }
      }, realDurationMs + 50);
    }
    #stopNote(channel, noteNumber) {
      const player = this.#players[channel];
      const envelope = this.#activeNotes[channel]?.get(noteNumber);
      if (envelope) {
        if (envelope.cleanupTimer) clearTimeout(envelope.cleanupTimer);
        const removeNoteFromRegistry = () => {
          this.#activeNotes[channel]?.delete(noteNumber);
          this.#updateChannelStates();
        };
        if (player && player.isSustainActive()) {
          player.registerSustainNote(() => envelope.cancel(false));
        } else {
          envelope.cancel(false);
        }
        removeNoteFromRegistry();
      }
    }
    #clearActiveNotes() {
      Object.keys(this.#activeNotes).forEach((channel) => {
        this.#activeNotes[channel].forEach((envelope, note) => {
          if (envelope) {
            if (envelope.cleanupTimer) clearTimeout(envelope.cleanupTimer);
            if (envelope.cancel) envelope.cancel(true);
          }
          this.#activeNotes[channel]?.delete(note);
        });
      });
      this.#updateChannelStates();
    }
    async #updateChannelStates() {
      let hasChanged = false;
      const nextStates = {};
      Object.keys(this.#players).forEach((channel) => {
        const isActive = Boolean(this.#activeNotes[channel]?.size && this.#activeNotes[channel].size > 0);
        nextStates[channel] = isActive;
        if (this.#channelStates[channel] !== isActive) hasChanged = true;
      });
      if (hasChanged) {
        this.#channelStates = nextStates;
        this.triggerPlayerEvent("channelState", this.#channelStates);
      }
    }
    async #repairMidi(buffer) {
      const src = new Uint8Array(buffer);
      const view = new DataView(buffer);
      const magic = String.fromCharCode(...src.slice(0, 4));
      if (magic !== "MThd") throw new Error("Invalid MIDI file (MThd missing)");
      const headerLen = view.getUint32(4);
      const format = view.getUint16(8);
      const ntrks = view.getUint16(10);
      const division = view.getUint16(12);
      const EOT = [255, 47, 0];
      const chunks = [];
      let pos = 8 + headerLen;
      while (pos < src.length) {
        if (pos + 8 > src.length) {
          break;
        }
        const tag = String.fromCharCode(...src.slice(pos, pos + 4));
        const declaredLen = view.getUint32(pos + 4);
        const dataStart = pos + 8;
        const dataEnd = dataStart + declaredLen;
        if (tag !== "MTrk") {
          const end = Math.min(dataEnd, src.length);
          chunks.push({ tag, data: src.slice(pos, end), repaired: false });
          pos = dataEnd;
          continue;
        }
        const trackNum = chunks.filter((c) => c.tag === "MTrk").length + 1;
        const available = Math.min(declaredLen, src.length - dataStart);
        const trackData = src.slice(dataStart, dataStart + available);
        const last3 = trackData.slice(-3);
        const hasEOT = last3[0] === 255 && last3[1] === 47 && last3[2] === 0;
        if (hasEOT && available === declaredLen) {
          chunks.push({ tag, data: trackData, repaired: false });
        } else {
          let repairedData;
          if (available < declaredLen) {
            const missing = declaredLen - available;
            const last2 = trackData.slice(-2);
            if (last2[0] === 255 && last2[1] === 47) {
              repairedData = new Uint8Array(trackData.length + 1);
              repairedData.set(trackData);
              repairedData[trackData.length] = 0;
            } else {
              repairedData = new Uint8Array(trackData.length + 3);
              repairedData.set(trackData);
              repairedData.set(EOT, trackData.length);
            }
          } else {
            repairedData = new Uint8Array(trackData.length + 3);
            repairedData.set(trackData);
            repairedData.set(EOT, trackData.length);
          }
          chunks.push({ tag, data: repairedData, repaired: true });
        }
        pos = dataEnd;
      }
      const fixedNtrks = chunks.filter((c) => c.tag === "MTrk").length;
      const totalSize = 14 + chunks.reduce((acc, c) => acc + 8 + c.data.length, 0);
      const out = new Uint8Array(totalSize);
      const outView = new DataView(out.buffer);
      out.set([77, 84, 104, 100], 0);
      outView.setUint32(4, 6);
      outView.setUint16(8, format);
      outView.setUint16(10, fixedNtrks);
      outView.setUint16(12, division);
      let outPos = 14;
      for (const chunk of chunks) {
        const tagBytes = chunk.tag.split("").map((c) => c.charCodeAt(0));
        out.set(tagBytes, outPos);
        outView.setUint32(outPos + 4, chunk.data.length);
        out.set(chunk.data, outPos + 8);
        outPos += 8 + chunk.data.length;
      }
      const repairedCount = chunks.filter((c) => c.repaired).length;
      return out.buffer;
    }
    #trimMidiEvents() {
      if (!this.events || this.events.length === 0) return;
      let firstNoteTick = Infinity;
      let lastNoteTick = 0;
      this.events.forEach((track) => {
        track.forEach((event) => {
          if (event.name === "Note on" || event.name === "Note off") {
            if (event.tick < firstNoteTick) firstNoteTick = event.tick;
            if (event.tick > lastNoteTick) lastNoteTick = event.tick;
          }
        });
      });
      if (firstNoteTick === Infinity) return;
      const allSetupEventsBeforeFirstNote = [];
      this.events.forEach((track, trackIdx) => {
        track.forEach((event) => {
          const isSetupEvent = event.name === "Program Change" || event.name === "Controller Change" || event.name === "Pitch Bend" || event.name === "Set Tempo";
          if (event.tick < firstNoteTick && isSetupEvent) {
            allSetupEventsBeforeFirstNote.push({ event, trackIdx });
          }
        });
      });
      const uniqueSetupByTrack = Object.fromEntries(this.events.map((_, idx) => [idx, []]));
      const globalUniqueKeys = /* @__PURE__ */ new Set();
      for (let i = allSetupEventsBeforeFirstNote.length - 1; i >= 0; i--) {
        const { event, trackIdx } = allSetupEventsBeforeFirstNote[i];
        const channel = event.channel !== void 0 ? event.channel : "track-".concat(trackIdx);
        let key = null;
        if (event.name === "Program Change") {
          key = "pc:".concat(channel);
        } else if (event.name === "Controller Change") {
          key = "cc:".concat(channel, ":").concat(event.number);
        } else if (event.name === "Pitch Bend") {
          key = "pb:".concat(channel);
        } else if (event.name === "Set Tempo") {
          key = "tempo";
        }
        if (key) {
          if (!globalUniqueKeys.has(key)) {
            globalUniqueKeys.add(key);
            const clonedEvent = { ...event, tick: 0 };
            uniqueSetupByTrack[trackIdx].push(clonedEvent);
          }
        }
      }
      const trimmedEvents = this.events.map((track, trackIdx) => {
        const newTrack = [];
        track.forEach((event) => {
          const isSetupEvent = event.name === "Program Change" || event.name === "Controller Change" || event.name === "Pitch Bend" || event.name === "Set Tempo";
          const isTextOrKaraoke = event.name === "Text Event" || event.name === "Lyric Event" || event.name === "Track Name" || event.name === "Karaoke Event";
          if (event.tick < firstNoteTick) {
            if (!isSetupEvent && (isTextOrKaraoke || trackIdx === 0)) {
              event.tick = 0;
              newTrack.push(event);
            }
          } else {
            event.tick = event.tick - firstNoteTick;
            const maxAllowedTick = lastNoteTick - firstNoteTick;
            if (event.tick > maxAllowedTick) {
              event.tick = maxAllowedTick;
            }
            newTrack.push(event);
          }
        });
        const filteredTrackSetup = uniqueSetupByTrack[trackIdx] || [];
        return [...filteredTrackSetup, ...newTrack].sort((a, b) => a.tick - b.tick);
      });
      this.events = trimmedEvents;
      this.totalTicks = lastNoteTick - firstNoteTick;
      if (typeof this.computeTempoMap === "function") this.computeTempoMap();
    }
    async #extractLyrics() {
      if (this.#lyrics) return this.#lyrics;
      const structure = { language: "", title: "", paragraphs: [] };
      let bestTrack = null;
      let maxTextEventsCount = 0;
      this.events.forEach((track) => {
        const textEventsInTrack = track.filter(
          (e) => e.name === "Text Event" || e.name === "Lyric Event" || e.name === "Cue Point" || e.name === "Marker" || e.name === "Track Name"
        );
        const realLyricsCount = textEventsInTrack.filter((e) => {
          const textStr = e.string || e.text || "";
          return textStr && !textStr.startsWith("@");
        }).length;
        if (realLyricsCount > maxTextEventsCount) {
          maxTextEventsCount = realLyricsCount;
          bestTrack = textEventsInTrack;
        }
      });
      if (!bestTrack || bestTrack.length === 0) return structure;
      const allTextEvents = bestTrack.sort((a, b) => a.tick - b.tick);
      let paragraphs = [];
      let currentParaLines = [];
      let currentLineBlocks = [];
      let lastBlockTick = 0;
      allTextEvents.forEach((event) => {
        let text = this.#decodeKaraokeString(event.string || "");
        if (!text) return;
        if (/^Track-/i.test(text.trim()) || /^Piste/i.test(text.trim()) || text.trim() === "" || event.tick === 0 && text.length > 20) {
          return;
        }
        if (text.startsWith("@L")) {
          structure.language = text.substring(2).trim();
          return;
        }
        if (text.startsWith("@T")) {
          structure.title += (structure.title ? " / " : "") + text.substring(2).trim();
          return;
        }
        if (text.startsWith("@") || text.startsWith("(") || text.startsWith("PART") || /^\d+\s+\d+/.test(text.trim())) {
          return;
        }
        if (/^(Verse|Chorus|Bridge|Break|Intro|End\.)/i.test(text.trim())) {
          const isExplicitCut = text.startsWith("\\") || text.startsWith("/");
          const isNaturalTransition = currentLineBlocks.length === 0 || event.tick - lastBlockTick > 500;
          if (isExplicitCut || isNaturalTransition) {
            if (currentLineBlocks.length > 0) {
              currentParaLines.push({ tick: currentLineBlocks[0].tick, blocks: currentLineBlocks });
              currentLineBlocks = [];
            }
            if (currentParaLines.length > 0) {
              while (currentParaLines.length > 4) {
                const linesToPush = currentParaLines.splice(0, 4);
                paragraphs.push({ tick: linesToPush[0].tick, lines: linesToPush });
              }
              if (currentParaLines.length > 0) {
                paragraphs.push({ tick: currentParaLines[0].tick, lines: currentParaLines });
                currentParaLines = [];
              }
            }
          }
          return;
        }
        let forceNewLine = false;
        if (currentLineBlocks.length > 0) {
          const prevBlock = currentLineBlocks[currentLineBlocks.length - 1];
          const prevText = prevBlock.text;
          const currentTrimmed = text.trimLeft();
          if (currentTrimmed.length > 0) {
            const isCapitalized = /^[A-Z]/.test(currentTrimmed) || /^'[A-Z]/.test(currentTrimmed);
            const prevIsCapitalized = /^[A-Z]/.test(prevText.trim()) || /^'[A-Z]/.test(prevText.trim());
            if (isCapitalized && !prevText.endsWith(" ") && prevText.trim() != "o" && !prevIsCapitalized) {
              if (event.tick > lastBlockTick) {
                forceNewLine = true;
              }
            }
            if (text.startsWith('"') && prevText.endsWith('"')) {
              forceNewLine = true;
            }
            if (text.startsWith('"') && (prevText.endsWith(")") || prevText.endsWith(')"'))) {
              forceNewLine = true;
            }
            if (currentTrimmed.startsWith('"') && prevText.trimRight().endsWith(")")) {
              forceNewLine = true;
            }
          }
        }
        const isNewParagraphMarker = text.startsWith("\\");
        const isNewLineMarker = text.startsWith("/") || forceNewLine;
        if (isNewParagraphMarker || isNewLineMarker) {
          if (text.startsWith("\\") || text.startsWith("/")) {
            text = text.substring(1);
          }
        }
        text = text.replace(/[\r\n]/g, "");
        let isTimeGapTrigger = false;
        if (lastBlockTick > 0 && event.tick > lastBlockTick) {
          const secondsSilence = this.ticksToSeconds(lastBlockTick, event.tick);
          if (secondsSilence > 2.5) {
            isTimeGapTrigger = true;
          }
        }
        const currentLineChars = currentLineBlocks.reduce((sum, b) => sum + b.text.length, 0);
        const isWordLimitTrigger = currentLineChars + text.length > this.#opts.maxCharPerLine;
        if (isNewLineMarker || isNewParagraphMarker || isTimeGapTrigger || isWordLimitTrigger) {
          if (currentLineBlocks.length > 0) {
            currentParaLines.push({ tick: currentLineBlocks[0].tick, blocks: currentLineBlocks });
            currentLineBlocks = [];
          }
          if (currentParaLines.length > 0) {
            if (isNewParagraphMarker || isTimeGapTrigger) {
              while (currentParaLines.length > 4) {
                const linesToPush = currentParaLines.splice(0, 4);
                paragraphs.push({ tick: linesToPush[0].tick, lines: linesToPush });
              }
              if (currentParaLines.length > 0) {
                paragraphs.push({ tick: currentParaLines[0].tick, lines: currentParaLines });
                currentParaLines = [];
              }
            } else if (currentParaLines.length >= 6) {
              const linesToPush = currentParaLines.splice(0, 4);
              paragraphs.push({ tick: linesToPush[0].tick, lines: linesToPush });
            }
          }
        }
        if (text.length > 0) {
          currentLineBlocks.push({ text, tick: event.tick });
          lastBlockTick = event.tick;
        }
      });
      if (currentLineBlocks.length > 0) {
        currentParaLines.push({
          tick: currentLineBlocks[0].tick,
          blocks: currentLineBlocks
        });
      }
      while (currentParaLines.length > 4) {
        const linesToPush = currentParaLines.splice(0, 4);
        paragraphs.push({ tick: linesToPush[0].tick, lines: linesToPush });
      }
      if (currentParaLines.length > 0) {
        paragraphs.push({ tick: currentParaLines[0].tick, lines: currentParaLines });
      }
      paragraphs = paragraphs.filter((p) => {
        return !(p.lines.length == 1 && p.lines[0].blocks.length == 1 && ["intro", "outro", "sfx", "solo", "chorus", "verse", "bridge", "break", "end"].includes(p.lines[0].blocks[0].text.toLowerCase().trim()));
      });
      if (paragraphs.length <= 2) paragraphs = [];
      structure.paragraphs = paragraphs;
      this.#lyrics = structure;
      return structure;
    }
    async #generateKaraokeFrames() {
      const lyrics = await this.#extractLyrics();
      if (!lyrics.paragraphs.length) {
        this.#haveLyrics = false;
        this.events[_MidiAudioPlayer.KARAOKE_CHANNEL].push({
          text: '<span class="karaoke-intro"></span>',
          name: "Karaoke Event",
          type: "intro",
          tick: 0,
          channel: _MidiAudioPlayer.KARAOKE_CHANNEL
        });
        this.events[_MidiAudioPlayer.KARAOKE_CHANNEL] = this.events[_MidiAudioPlayer.KARAOKE_CHANNEL].sort((a, b) => a.tick - b.tick);
        return;
      }
      this.#haveLyrics = true;
      this.#title = lyrics.title;
      let lastFrameEnd = 0;
      const delayTicks = this.secondsToTicks(this.#opts.karaokeDelay);
      const threeSecondsInTicks = this.secondsToTicks(3);
      const fiveSecondsInTicks = this.secondsToTicks(5);
      const sevenSecondsInTicks = this.secondsToTicks(7);
      const tenSecondsInTicks = this.secondsToTicks(10);
      const allBlocksInSong = [];
      lyrics.paragraphs.forEach((p, pIdx) => {
        p.lines.forEach((l, lIdx) => {
          l.blocks.forEach((b) => {
            allBlocksInSong.push({
              block: b,
              lineIdx: lIdx,
              paraIdx: pIdx,
              paragraph: p,
              fastLinesText: p.lines.map((li) => li.blocks.map((bl) => bl.text).join(""))
            });
          });
        });
      });
      const paragraphDisplayTicks = [];
      lyrics.paragraphs.forEach((p, pIdx) => {
        let paragraphDisplayTick = this.getTickBeforeSeconds(p.tick, 5);
        if (paragraphDisplayTick < lastFrameEnd)
          paragraphDisplayTick = lastFrameEnd + (p.tick - lastFrameEnd) / 2;
        if (pIdx === 0 && paragraphDisplayTick < 20)
          paragraphDisplayTick = 20;
        paragraphDisplayTicks[pIdx] = paragraphDisplayTick;
        const fastLinesText = p.lines.map((li) => li.blocks.map((b) => b.text).join(""));
        const initialHTML = fastLinesText.map((lineText) => '<span class="karaoke-coming">'.concat(lineText, "</span>")).join("<br/>");
        this.events[_MidiAudioPlayer.KARAOKE_CHANNEL].push({
          text: initialHTML,
          name: "Karaoke Event",
          type: "lyric",
          tick: paragraphDisplayTick,
          channel: _MidiAudioPlayer.KARAOKE_CHANNEL
        });
        if (p.lines.length > 0) {
          const lastLine = p.lines[p.lines.length - 1];
          if (lastLine.blocks.length > 0)
            lastFrameEnd = lastLine.blocks[lastLine.blocks.length - 1].tick;
        }
      });
      const firstParaDisplayTick = paragraphDisplayTicks[0] || 0;
      if (firstParaDisplayTick > 25) {
        this.events[_MidiAudioPlayer.KARAOKE_CHANNEL].push({
          text: '<span class="karaoke-clear"></span>',
          name: "Karaoke Event",
          type: "clear",
          tick: 5,
          channel: _MidiAudioPlayer.KARAOKE_CHANNEL
        });
      }
      allBlocksInSong.forEach((current, index2) => {
        const currentBlock = current.block;
        const currentLineIdx = current.lineIdx;
        const currentParaIdx = current.paraIdx;
        const p = current.paragraph;
        const fastLinesText = current.fastLinesText;
        const generateHTML = (forceAllPlayedOnActiveLine = false) => {
          return p.lines.map((li, liIdx) => {
            if (liIdx < currentLineIdx)
              return '<span class="karaoke-played">'.concat(fastLinesText[liIdx], "</span>");
            if (liIdx > currentLineIdx)
              return '<span class="karaoke-coming">'.concat(fastLinesText[liIdx], "</span>");
            let lineHTML = "";
            li.blocks.forEach((block) => {
              let className = "coming";
              if (forceAllPlayedOnActiveLine || block.tick < currentBlock.tick)
                className = "played";
              else if (block.tick === currentBlock.tick)
                className = "playing";
              lineHTML += '<span class="karaoke-'.concat(className, '">').concat(block.text, "</span>");
            });
            return lineHTML;
          }).join("<br>");
        };
        this.events[_MidiAudioPlayer.KARAOKE_CHANNEL].push({
          text: generateHTML(false),
          name: "Karaoke Event",
          type: "lyric",
          tick: currentBlock.tick - delayTicks,
          channel: _MidiAudioPlayer.KARAOKE_CHANNEL
        });
        const next = allBlocksInSong[index2 + 1];
        if (next) {
          const tickDifference = next.block.tick - currentBlock.tick;
          if (tickDifference > threeSecondsInTicks) {
            let targetCleanupTick = currentBlock.tick + threeSecondsInTicks;
            let targetClearTick = currentBlock.tick + sevenSecondsInTicks;
            let shouldAddClear = tickDifference > tenSecondsInTicks && currentParaIdx > 0;
            if (next.paraIdx !== currentParaIdx) {
              const nextParaDisplayTick = paragraphDisplayTicks[next.paraIdx];
              if (targetCleanupTick >= nextParaDisplayTick)
                targetCleanupTick = nextParaDisplayTick - 1;
              if (shouldAddClear) {
                if (targetClearTick >= nextParaDisplayTick || nextParaDisplayTick - targetClearTick < threeSecondsInTicks)
                  shouldAddClear = false;
              }
            }
            if (targetCleanupTick > currentBlock.tick) {
              this.events[_MidiAudioPlayer.KARAOKE_CHANNEL].push({
                text: generateHTML(true),
                name: "Karaoke Event",
                type: "lyric",
                tick: targetCleanupTick - delayTicks,
                channel: _MidiAudioPlayer.KARAOKE_CHANNEL
              });
            }
            if (shouldAddClear && targetClearTick > targetCleanupTick) {
              this.events[_MidiAudioPlayer.KARAOKE_CHANNEL].push({
                text: '<span class="karaoke-clear"></span>',
                name: "Karaoke Event",
                type: "clear",
                tick: targetClearTick - delayTicks,
                channel: _MidiAudioPlayer.KARAOKE_CHANNEL
              });
            }
          }
        }
        lastFrameEnd = currentBlock.tick;
      });
      if (this.totalTicks - lastFrameEnd > this.secondsToTicks(5)) {
        this.events[_MidiAudioPlayer.KARAOKE_CHANNEL].push({
          text: '<span class="karaoke-clear"></span>',
          name: "Karaoke Event",
          type: "clear",
          tick: lastFrameEnd + this.secondsToTicks(5),
          channel: _MidiAudioPlayer.KARAOKE_CHANNEL
        });
      } else {
        this.events[_MidiAudioPlayer.KARAOKE_CHANNEL].push({
          text: '<span class="karaoke-clear"></span>',
          name: "Karaoke Event",
          type: "clear",
          tick: this.totalTicks - 1,
          channel: _MidiAudioPlayer.KARAOKE_CHANNEL
        });
      }
      this.events[_MidiAudioPlayer.KARAOKE_CHANNEL] = this.events[_MidiAudioPlayer.KARAOKE_CHANNEL].sort((a, b) => a.tick - b.tick);
    }
    async #detectKaraokeVocalChannel() {
      const lyrics = await this.#extractLyrics();
      if (!lyrics?.paragraphs?.length) return null;
      const textTicks = lyrics.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.blocks.map((b) => b.tick)));
      if (textTicks.length === 0) return null;
      const tickTolerance = this.division ? this.division / 2 : 48;
      const VOCAL_MIN = 48;
      const VOCAL_MAX = 84;
      const channelsToScan = Object.keys(this.#channels).map(Number).filter((chan) => chan !== 10);
      let bestChannel = null;
      let bestScore = -Infinity;
      for (const channel of channelsToScan) {
        const notes = this.events.flatMap(
          (track) => track.filter(
            (e) => e.name === "Note on" && e.velocity > 0 && e.channel === channel
          )
        );
        if (notes.length === 0) continue;
        const aligned = textTicks.filter(
          (t) => notes.some((n) => Math.abs(n.tick - t) <= tickTolerance)
        ).length;
        const alignmentScore = aligned / textTicks.length;
        const notesInRange = notes.filter((n) => n.noteNumber >= VOCAL_MIN && n.noteNumber <= VOCAL_MAX);
        const rangeScore = notesInRange.length / notes.length;
        if (rangeScore < 0.3) continue;
        const sorted = [...notes].sort((a, b) => a.tick - b.tick);
        const minGap = this.division / 8 || 6;
        const poly = sorted.filter((n, i) => i > 0 && Math.abs(n.tick - sorted[i - 1].tick) < minGap).length;
        const monophonyScore = 1 - poly / Math.max(notes.length - 1, 1);
        const densityRatio = notes.length / Math.max(textTicks.length, 1);
        const densityScore = densityRatio < 0.3 ? densityRatio / 0.3 : densityRatio > 5 ? Math.max(0, 1 - (densityRatio - 5) / 10) : 1;
        const score = alignmentScore * 0.45 + rangeScore * 0.35 + monophonyScore * 0.15 + densityScore * 0.05;
        if (score > bestScore) {
          bestScore = score;
          bestChannel = channel;
        }
      }
      return bestScore >= 0.4 ? bestChannel : null;
    }
    #decodeKaraokeString(str) {
      if (!str) return "";
      const bytes = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 255;
      const decoder = new TextDecoder("windows-1252");
      let decoded = decoder.decode(bytes);
      decoded = decoded.replace(/ÿ/g, "");
      decoded = decoded.replace(/’/g, "'");
      decoded = decoded.replace(/`/g, "'");
      return decoded;
    }
    #sendKaraokeFrame(type = "clear", text = "") {
      const html = '<span class="karaoke-'.concat(type, '">').concat(text.replace(/\s\/\s/g, "<br>"), "</span>");
      if (this.#opts.karaoke) {
        if (type == "title") queueMicrotask(() => this.triggerPlayerEvent("karaoke", { type, title: text, html }));
        else queueMicrotask(() => this.triggerPlayerEvent("karaoke", { type, html }));
      }
    }
    #log(str, err = false) {
      queueMicrotask(() => this.triggerPlayerEvent("logs", str));
    }
  };

  // index.js
  if (typeof window !== "undefined") window.MidiAudioPlayer = MidiAudioPlayer;
  var index_default2 = MidiAudioPlayer;
})();
