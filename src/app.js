import * as Tone from "https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm";
import { Midi } from "https://cdn.jsdelivr.net/npm/@tonejs/midi@2.0.28/+esm";

const midiFileInput = document.getElementById("midiFile");
const fileInfo = document.getElementById("fileInfo");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const seekBar = document.getElementById("seekBar");
const timeInfo = document.getElementById("timeInfo");
const trackList = document.getElementById("trackList");
const tempoControl = document.getElementById("tempoControl");
const tempoValue = document.getElementById("tempoValue");

const state = {
  midi: null,
  tracks: [],
  isPlaying: false,
  rafId: null,
};

function toTimeLabel(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function setControlsEnabled(enabled) {
  playBtn.disabled = !enabled;
  pauseBtn.disabled = !enabled;
  stopBtn.disabled = !enabled;
  seekBar.disabled = !enabled;
}

function clearPlaybackGraph() {
  state.tracks.forEach(({ part, synth }) => {
    part.dispose();
    synth.dispose();
  });
  state.tracks = [];
  Tone.Transport.cancel();
  Tone.Transport.stop();
  Tone.Transport.seconds = 0;
  state.isPlaying = false;
  cancelAnimationFrame(state.rafId);
  state.rafId = null;
}

function createInstrument(track) {
  const channel = track.channel;
  if (track.instrument.percussion || channel === 9) {
    return {
      synth: new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 5,
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.3 },
      }).toDestination(),
      isDrum: true,
    };
  }

  const family = (track.instrument.family || "").toLowerCase();
  if (["bass"].includes(family)) {
    return {
      synth: new Tone.MonoSynth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.35, release: 0.6 },
      }).toDestination(),
      isDrum: false,
    };
  }

  const familyTypeMap = {
    piano: "triangle",
    guitar: "square",
    strings: "sine",
    ensemble: "sine",
    brass: "sawtooth",
    reed: "sawtooth",
    pipe: "sine",
    synthlead: "square",
    synthpad: "triangle",
    ethnics: "triangle",
  };

  const oscillator = familyTypeMap[family] || "triangle";
  return {
    synth: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: oscillator },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.35, release: 0.8 },
    }).toDestination(),
    isDrum: false,
  };
}

function renderTrackList() {
  trackList.innerHTML = "";
  if (!state.tracks.length) {
    trackList.textContent = "未检测到可播放轨道";
    return;
  }

  state.tracks.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "track-item";

    const info = document.createElement("div");
    const name = item.track.name || `Track ${index + 1}`;
    info.innerHTML = `<strong>${name}</strong><br/><span>${item.track.notes.length} notes · ch ${item.track.channel + 1} · ${item.track.instrument.name}</span>`;

    const label = document.createElement("label");
    label.className = "inline";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.enabled;
    checkbox.addEventListener("change", () => {
      item.enabled = checkbox.checked;
      item.synth.volume.value = item.enabled ? 0 : -Infinity;
    });

    label.append("启用", checkbox);
    wrapper.append(info, label);
    trackList.append(wrapper);
  });
}

function updateTimeline() {
  if (!state.midi) {
    return;
  }
  const duration = state.midi.duration || 0;
  const position = Math.min(Tone.Transport.seconds, duration);
  seekBar.value = duration ? String(position / duration) : "0";
  timeInfo.textContent = `${toTimeLabel(position)} / ${toTimeLabel(duration)}`;

  if (state.isPlaying && position >= duration) {
    Tone.Transport.stop();
    Tone.Transport.seconds = 0;
    state.isPlaying = false;
    seekBar.value = "0";
  }

  if (state.isPlaying) {
    state.rafId = requestAnimationFrame(updateTimeline);
  }
}

function preparePlayback(midi) {
  clearPlaybackGraph();
  state.midi = midi;

  Tone.Transport.PPQ = midi.header.ppq || 480;
  Tone.Transport.timeSignature = midi.header.timeSignatures?.[0]?.timeSignature || [4, 4];
  Tone.Transport.bpm.value = midi.header.tempos?.[0]?.bpm || 120;
  Tone.Transport.playbackRate = Number(tempoControl.value);

  state.tracks = midi.tracks
    .filter((track) => track.notes.length > 0)
    .map((track) => {
      const { synth, isDrum } = createInstrument(track);
      const part = new Tone.Part((time, note) => {
        if (!item.enabled) {
          return;
        }
        if (isDrum) {
          const drumFreq = Tone.Frequency(note.midi, "midi").toFrequency();
          synth.triggerAttackRelease(drumFreq, Math.max(note.duration, 0.06), time, note.velocity);
          return;
        }
        synth.triggerAttackRelease(note.name, Math.max(note.duration, 0.03), time, note.velocity);
      }, track.notes.map((note) => [note.time, note]));

      part.start(0);
      const item = { track, synth, part, enabled: true };
      return item;
    });

  seekBar.max = "1";
  seekBar.value = "0";
  timeInfo.textContent = `00:00 / ${toTimeLabel(midi.duration || 0)}`;
  setControlsEnabled(state.tracks.length > 0);
  renderTrackList();
}

async function startPlayback(fromSeconds = Tone.Transport.seconds) {
  if (!state.midi || !state.tracks.length) {
    return;
  }

  await Tone.start();
  Tone.Transport.seconds = Math.max(0, Math.min(fromSeconds, state.midi.duration || 0));
  Tone.Transport.start("+0.05", Tone.Transport.seconds);
  state.isPlaying = true;
  cancelAnimationFrame(state.rafId);
  state.rafId = requestAnimationFrame(updateTimeline);
}

midiFileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const midi = new Midi(buffer);
    preparePlayback(midi);

    fileInfo.textContent = `已加载: ${file.name} | Format ${midi.header.format} | ${midi.tracks.length} tracks`;
  } catch (error) {
    clearPlaybackGraph();
    setControlsEnabled(false);
    trackList.textContent = "解析失败，请检查文件是否为标准 MIDI";
    fileInfo.textContent = `加载失败: ${error instanceof Error ? error.message : "未知错误"}`;
  }
});

playBtn.addEventListener("click", () => {
  startPlayback();
});

pauseBtn.addEventListener("click", () => {
  if (!state.midi) {
    return;
  }
  Tone.Transport.pause();
  state.isPlaying = false;
  cancelAnimationFrame(state.rafId);
  state.rafId = null;
  updateTimeline();
});

stopBtn.addEventListener("click", () => {
  if (!state.midi) {
    return;
  }
  Tone.Transport.stop();
  Tone.Transport.seconds = 0;
  state.isPlaying = false;
  seekBar.value = "0";
  cancelAnimationFrame(state.rafId);
  state.rafId = null;
  updateTimeline();
});

seekBar.addEventListener("input", () => {
  if (!state.midi) {
    return;
  }
  const targetSeconds = Number(seekBar.value) * (state.midi.duration || 0);
  if (state.isPlaying) {
    startPlayback(targetSeconds);
  } else {
    Tone.Transport.seconds = targetSeconds;
    updateTimeline();
  }
});

tempoControl.addEventListener("input", () => {
  const rate = Number(tempoControl.value);
  Tone.Transport.playbackRate = rate;
  tempoValue.textContent = `${rate.toFixed(2)}x`;
});

setControlsEnabled(false);
