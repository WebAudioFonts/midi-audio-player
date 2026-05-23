import MidiAudioPlayer from './src/midiaudioplayer.js';

if (typeof window !== 'undefined') window.MidiAudioPlayer = MidiAudioPlayer;

export { MidiAudioPlayer };
export default MidiAudioPlayer;