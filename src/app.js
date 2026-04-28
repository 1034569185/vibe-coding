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
const engineSelect = document.getElementById("engineSelect");
const synthPresetSelect = document.getElementById("synthPreset");
const soundfontBankSelect = document.getElementById("soundfontBank");
const soundfontInstrumentSelect = document.getElementById("soundfontInstrument");
const soundfontStatus = document.getElementById("soundfontStatus");
// 留出少量延迟，确保 Tone.Transport 在启动时完成调度。
const SCHEDULE_START_DELAY_SECONDS = 0.05;
// 超过该阈值的“过去”音符将被丢弃，避免堆积到当前时间。
const PAST_NOTE_DROP_SECONDS = 0.01;
const MIN_NOTE_DURATION = 0.03;
const MIN_NOTE_VELOCITY = 0.05;
const MIN_DRUM_DURATION = 0.06;
const SOUND_FONT_SCRIPT_URLS = [
  "https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js",
  "https://unpkg.com/soundfont-player@0.12.0/dist/soundfont-player.min.js",
];
const DEFAULT_ENGINE = "soundfont";
const SOUND_FONT_DEFAULT_BANK = "MusyngKite";
const SOUND_FONT_DEFAULT_INSTRUMENT = "auto";
const SYNTH_PRESETS = {
  auto: {
    label: "自动（按乐器族）",
    familyTypeMap: {
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
    },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.35, release: 0.8 },
    monoEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.35, release: 0.6 },
    monoOscillator: "triangle",
  },
  bright: {
    label: "明亮 Synth",
    oscillator: "sawtooth",
    envelope: { attack: 0.01, decay: 0.18, sustain: 0.5, release: 0.5 },
  },
  warm: {
    label: "柔和 Pad",
    oscillator: "sine",
    envelope: { attack: 0.4, decay: 0.2, sustain: 0.7, release: 1.2 },
  },
  pluck: {
    label: "拨弦 Pluck",
    oscillator: "square",
    envelope: { attack: 0.002, decay: 0.2, sustain: 0.1, release: 0.2 },
  },
  bell: {
    label: "钟声 Bell",
    oscillator: "sine",
    envelope: { attack: 0.01, decay: 0.8, sustain: 0.1, release: 1.1 },
  },
  lead: {
    label: "主音 Lead",
    oscillator: "sawtooth",
    envelope: { attack: 0.02, decay: 0.15, sustain: 0.6, release: 0.4 },
  },
};
const SOUNDFONT_NAME_VARIANTS = {
  lead_8_bass_lead: ["lead_8_bass_lead", "lead_8_bass__lead"],
};
const GM_INSTRUMENTS = [
  "acoustic_grand_piano",
  "bright_acoustic_piano",
  "electric_grand_piano",
  "honkytonk_piano",
  "electric_piano_1",
  "electric_piano_2",
  "harpsichord",
  "clavinet",
  "celesta",
  "glockenspiel",
  "music_box",
  "vibraphone",
  "marimba",
  "xylophone",
  "tubular_bells",
  "dulcimer",
  "drawbar_organ",
  "percussive_organ",
  "rock_organ",
  "church_organ",
  "reed_organ",
  "accordion",
  "harmonica",
  "tango_accordion",
  "acoustic_guitar_nylon",
  "acoustic_guitar_steel",
  "electric_guitar_jazz",
  "electric_guitar_clean",
  "electric_guitar_muted",
  "overdriven_guitar",
  "distortion_guitar",
  "guitar_harmonics",
  "acoustic_bass",
  "electric_bass_finger",
  "electric_bass_pick",
  "fretless_bass",
  "slap_bass_1",
  "slap_bass_2",
  "synth_bass_1",
  "synth_bass_2",
  "violin",
  "viola",
  "cello",
  "contrabass",
  "tremolo_strings",
  "pizzicato_strings",
  "orchestral_harp",
  "timpani",
  "string_ensemble_1",
  "string_ensemble_2",
  "synth_strings_1",
  "synth_strings_2",
  "choir_aahs",
  "voice_oohs",
  "synth_choir",
  "orchestra_hit",
  "trumpet",
  "trombone",
  "tuba",
  "muted_trumpet",
  "french_horn",
  "brass_section",
  "synth_brass_1",
  "synth_brass_2",
  "soprano_sax",
  "alto_sax",
  "tenor_sax",
  "baritone_sax",
  "oboe",
  "english_horn",
  "bassoon",
  "clarinet",
  "piccolo",
  "flute",
  "recorder",
  "pan_flute",
  "blown_bottle",
  "shakuhachi",
  "whistle",
  "ocarina",
  "lead_1_square",
  "lead_2_sawtooth",
  "lead_3_calliope",
  "lead_4_chiff",
  "lead_5_charang",
  "lead_6_voice",
  "lead_7_fifths",
  "lead_8_bass_lead",
  "pad_1_new_age",
  "pad_2_warm",
  "pad_3_polysynth",
  "pad_4_choir",
  "pad_5_bowed",
  "pad_6_metallic",
  "pad_7_halo",
  "pad_8_sweep",
  "fx_1_rain",
  "fx_2_soundtrack",
  "fx_3_crystal",
  "fx_4_atmosphere",
  "fx_5_brightness",
  "fx_6_goblins",
  "fx_7_echoes",
  "fx_8_scifi",
  "sitar",
  "banjo",
  "shamisen",
  "koto",
  "kalimba",
  "bagpipe",
  "fiddle",
  "shanai",
  "tinkle_bell",
  "agogo",
  "steel_drums",
  "woodblock",
  "taiko_drum",
  "melodic_tom",
  "synth_drum",
  "reverse_cymbal",
  "guitar_fret_noise",
  "breath_noise",
  "seashore",
  "bird_tweet",
  "telephone_ring",
  "helicopter",
  "applause",
  "gunshot",
];

const state = {
  midi: null,
  tracks: [],
  isPlaying: false,
  rafId: null,
  engine: DEFAULT_ENGINE,
  soundfontBank: SOUND_FONT_DEFAULT_BANK,
  soundfontInstrument: SOUND_FONT_DEFAULT_INSTRUMENT,
  synthPreset: "auto",
  loadToken: 0,
};

let soundfontModulePromise = null;
let soundfontModule = null;

function formatSoundfontLabel(name) {
  return name.replace(/_/g, " ");
}

function setSoundfontStatus(message) {
  soundfontStatus.textContent = message;
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      if (window.Soundfont) {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`SoundFont 脚本加载失败：${url}`)), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`SoundFont 脚本加载失败：${url}`));
    document.head.appendChild(script);
  });
}

async function getSoundfontModule() {
  if (soundfontModule) {
    return soundfontModule;
  }
  if (!soundfontModulePromise) {
    soundfontModulePromise = (async () => {
      let lastError;
      for (const url of SOUND_FONT_SCRIPT_URLS) {
        try {
          await loadScript(url);
          if (window.Soundfont) {
            return window.Soundfont;
          }
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error("SoundFont 脚本加载失败");
    })();
  }

  try {
    soundfontModule = await soundfontModulePromise;
    return soundfontModule;
  } catch (error) {
    soundfontModulePromise = null;
    throw error;
  }
}

function populateSynthOptions() {
  synthPresetSelect.innerHTML = "";
  Object.entries(SYNTH_PRESETS).forEach(([value, preset]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = preset.label;
    synthPresetSelect.append(option);
  });
  synthPresetSelect.value = state.synthPreset;
}

function getSynthPresetConfig() {
  return SYNTH_PRESETS[state.synthPreset] || SYNTH_PRESETS.auto;
}

function populateSoundfontOptions() {
  soundfontInstrumentSelect.innerHTML = "";
  const autoOption = document.createElement("option");
  autoOption.value = SOUND_FONT_DEFAULT_INSTRUMENT;
  autoOption.textContent = "自动（跟随 MIDI）";
  soundfontInstrumentSelect.append(autoOption);

  GM_INSTRUMENTS.forEach((instrument) => {
    const option = document.createElement("option");
    option.value = instrument;
    option.textContent = formatSoundfontLabel(instrument);
    soundfontInstrumentSelect.append(option);
  });

  soundfontInstrumentSelect.value = state.soundfontInstrument;
}

function updateEngineControls() {
  const soundfontEnabled = state.engine === "soundfont";
  soundfontBankSelect.disabled = !soundfontEnabled;
  soundfontInstrumentSelect.disabled = !soundfontEnabled;
  synthPresetSelect.disabled = soundfontEnabled;
  setSoundfontStatus(
    soundfontEnabled
      ? "SoundFont 模式已启用，可选择 128 个 GM 音色，加载可能需要几秒钟。"
      : "当前使用合成器音色，可切换至 SoundFont 获得更高保真。",
  );
}

function getSoundfontNameCandidates(name) {
  // 某些音色在 SoundFont 文件中将 “+” 表示为双下划线（例如 lead_8_bass__lead）。
  return SOUNDFONT_NAME_VARIANTS[name] || [name];
}

function resolveSoundfontInstrument(track) {
  if (state.soundfontInstrument !== SOUND_FONT_DEFAULT_INSTRUMENT) {
    return state.soundfontInstrument;
  }
  let program = track.instrument.number;
  if (!Number.isFinite(program)) {
    console.warn("SoundFont: 未识别到有效的乐器编号，已回退为 0。");
    program = 0;
  }
  const safeIndex = Math.min(Math.max(program, 0), GM_INSTRUMENTS.length - 1);
  return GM_INSTRUMENTS[safeIndex];
}

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
  state.tracks.forEach(({ part, dispose }) => {
    part.dispose();
    dispose?.();
  });
  state.tracks = [];
  Tone.Transport.cancel();
  Tone.Transport.stop();
  Tone.Transport.seconds = 0;
  state.isPlaying = false;
  cancelAnimationFrame(state.rafId);
  state.rafId = null;
}

function createDrumInstrument() {
  const synth = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.3 },
  }).toDestination();

  return {
    playNote: (time, note) => {
      const drumFreq = Tone.Frequency(note.midi, "midi").toFrequency();
      synth.triggerAttackRelease(drumFreq, Math.max(note.duration, MIN_DRUM_DURATION), time, note.velocity);
    },
    setEnabled: (enabled) => {
      synth.volume.value = enabled ? 0 : -Infinity;
    },
    dispose: () => synth.dispose(),
    instrumentLabel: "Drums",
  };
}

function createToneInstrument(track) {
  const channel = track.channel;
  if (track.instrument.percussion || channel === 9) {
    return createDrumInstrument();
  }

  const family = (track.instrument.family || "").toLowerCase();
  const preset = getSynthPresetConfig();
  let synth;
  if (family === "bass") {
    synth = new Tone.MonoSynth({
      oscillator: { type: preset.monoOscillator || preset.oscillator || "triangle" },
      envelope: preset.monoEnvelope || preset.envelope || { attack: 0.01, decay: 0.2, sustain: 0.35, release: 0.6 },
    }).toDestination();
  } else {
    const oscillator =
      state.synthPreset === "auto"
        ? preset.familyTypeMap?.[family] || "triangle"
        : preset.oscillator || "triangle";
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: oscillator },
      envelope: preset.envelope || { attack: 0.005, decay: 0.2, sustain: 0.35, release: 0.8 },
    }).toDestination();
  }

  const presetLabel =
    state.synthPreset === "auto" ? track.instrument.name : `Synth: ${preset.label || "Preset"}`;

  return {
    playNote: (time, note) => {
      synth.triggerAttackRelease(note.name, Math.max(note.duration, MIN_NOTE_DURATION), time, note.velocity);
    },
    setEnabled: (enabled) => {
      synth.volume.value = enabled ? 0 : -Infinity;
    },
    dispose: () => synth.dispose(),
    instrumentLabel: presetLabel,
  };
}

async function createSoundfontInstrument(track, soundfont) {
  if (track.instrument.percussion || track.channel === 9) {
    return createDrumInstrument();
  }

  if (!soundfont) {
    return createToneInstrument(track);
  }

  const instrumentName = resolveSoundfontInstrument(track);
  const audioContext = Tone.getContext().rawContext;
  const candidates = getSoundfontNameCandidates(instrumentName);
  let lastError;
  for (const candidate of candidates) {
    try {
      const player = await soundfont.instrument(audioContext, candidate, {
        soundfont: state.soundfontBank,
        format: "mp3",
      });

      return {
        playNote: (time, note) => {
          // Tone.Part 回调的 time 与 AudioContext 时间基准一致；丢弃过期音符并对齐到当前时间。
          if (time < audioContext.currentTime - PAST_NOTE_DROP_SECONDS) {
            return;
          }
          const scheduledTime = Math.max(audioContext.currentTime, time);
          player.play(note.midi, scheduledTime, {
            duration: Math.max(note.duration, MIN_NOTE_DURATION),
            gain: Math.max(note.velocity, MIN_NOTE_VELOCITY),
          });
        },
        setEnabled: (enabled) => {
          if (!enabled) {
            player.stop();
          }
        },
        dispose: () => player.stop(),
        instrumentLabel: `SoundFont: ${formatSoundfontLabel(candidate)}`,
      };
    } catch (error) {
      lastError = error;
    }
  }

  const errorMessage = lastError instanceof Error ? lastError.message : "未知错误";
  setSoundfontStatus(`SoundFont 加载失败，已回退合成器：${errorMessage}`);
  return createToneInstrument(track);
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
    const instrumentLabel = item.instrumentLabel || item.track.instrument.name;
    const title = document.createElement("strong");
    title.textContent = name;
    const lineBreak = document.createElement("br");
    const meta = document.createElement("span");
    meta.textContent = `${item.track.notes.length} notes · ch ${item.track.channel + 1} · ${instrumentLabel}`;
    info.append(title, lineBreak, meta);

    const label = document.createElement("label");
    label.className = "inline";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.enabled;
    checkbox.addEventListener("change", () => {
      item.enabled = checkbox.checked;
      item.setEnabled?.(item.enabled);
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

async function preparePlayback(midi) {
  clearPlaybackGraph();
  state.midi = midi;
  state.loadToken += 1;
  const loadToken = state.loadToken;

  Tone.Transport.PPQ = midi.header.ppq || 480;
  Tone.Transport.timeSignature = midi.header.timeSignatures?.[0]?.timeSignature || [4, 4];
  Tone.Transport.bpm.value = midi.header.tempos?.[0]?.bpm || 120;
  Tone.Transport.playbackRate = Number(tempoControl.value);

  if (state.engine === "soundfont") {
    setSoundfontStatus("SoundFont 音色加载中，请稍候...");
  }

  let soundfont = null;
  if (state.engine === "soundfont") {
    try {
      soundfont = await getSoundfontModule();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      setSoundfontStatus(`SoundFont 加载失败，已切换合成器：${errorMessage}`);
      state.engine = "synth";
      engineSelect.value = state.engine;
      updateEngineControls();
    }
  }

  const trackItems = await Promise.all(
    midi.tracks
      .filter((track) => track.notes.length > 0)
      .map(async (track) => {
        if (loadToken !== state.loadToken) {
          return null;
        }
        const instrument =
          state.engine === "soundfont"
            ? await createSoundfontInstrument(track, soundfont)
            : createToneInstrument(track);

        if (loadToken !== state.loadToken) {
          // 避免异步加载的旧音色在设置变更后仍被使用（防止竞态）。
          instrument.dispose?.();
          return null;
        }

        const item = {
          track,
          part: null,
          enabled: true,
          playNote: instrument.playNote,
          setEnabled: instrument.setEnabled,
          dispose: instrument.dispose,
          instrumentLabel: instrument.instrumentLabel,
        };

        const part = new Tone.Part((time, note) => {
          if (!item.enabled) {
            return;
          }
          item.playNote(time, note);
        }, track.notes.map((note) => [note.time, note]));

        part.start(0);
        item.part = part;
        return item;
      }),
  );

  if (loadToken !== state.loadToken) {
    return;
  }

  state.tracks = trackItems.filter(Boolean);

  seekBar.max = "1";
  seekBar.value = "0";
  timeInfo.textContent = `00:00 / ${toTimeLabel(midi.duration || 0)}`;
  setControlsEnabled(state.tracks.length > 0);
  renderTrackList();

  if (state.engine === "soundfont") {
    setSoundfontStatus(
      state.tracks.length
        ? `SoundFont 音色已就绪：${state.soundfontBank}`
        : "SoundFont 音色加载完成，但未检测到可播放轨道。",
    );
  }
}

async function startPlayback(fromSeconds = Tone.Transport.seconds) {
  if (!state.midi || !state.tracks.length) {
    return;
  }

  await Tone.start();
  Tone.Transport.seconds = Math.max(0, Math.min(fromSeconds, state.midi.duration || 0));
  Tone.Transport.start(`+${SCHEDULE_START_DELAY_SECONDS}`, Tone.Transport.seconds);
  state.isPlaying = true;
  cancelAnimationFrame(state.rafId);
  state.rafId = requestAnimationFrame(updateTimeline);
}

async function reloadPlaybackIfReady() {
  if (!state.midi) {
    return;
  }
  await preparePlayback(state.midi);
}

midiFileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const midi = new Midi(buffer);
    await preparePlayback(midi);

    fileInfo.textContent = `已加载: ${file.name} | Format ${midi.header.format} | ${midi.tracks.length} tracks`;
  } catch (error) {
    clearPlaybackGraph();
    setControlsEnabled(false);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    trackList.textContent = `解析失败：${errorMessage}，请检查文件是否为标准 MIDI`;
    fileInfo.textContent = `加载失败: ${errorMessage}`;
  }
});

engineSelect.addEventListener("change", async () => {
  state.engine = engineSelect.value;
  updateEngineControls();
  await reloadPlaybackIfReady();
});

soundfontBankSelect.addEventListener("change", async () => {
  state.soundfontBank = soundfontBankSelect.value;
  await reloadPlaybackIfReady();
});

soundfontInstrumentSelect.addEventListener("change", async () => {
  state.soundfontInstrument = soundfontInstrumentSelect.value;
  await reloadPlaybackIfReady();
});

synthPresetSelect.addEventListener("change", async () => {
  state.synthPreset = synthPresetSelect.value;
  await reloadPlaybackIfReady();
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

engineSelect.value = state.engine;
soundfontBankSelect.value = state.soundfontBank;
populateSynthOptions();
populateSoundfontOptions();
updateEngineControls();
setControlsEnabled(false);
