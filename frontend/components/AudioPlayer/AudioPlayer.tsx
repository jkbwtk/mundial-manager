import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { parseWebStream } from 'music-metadata';
import {
  createMemo,
  createResource,
  For,
  Match,
  mergeProps,
  onMount,
  Show,
  Switch,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';
import albumCover from '#assets/images/album_cover.svg';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { ProgressBar } from '#components/ProgresBar';
import { TextMarquee } from '#components/TextMarquee';
import { Divider, Widget } from '#components/Widget';
import { bytesToBase64, isDev } from '#flib/utils';
import type { RequiredDefaults } from '#shared/utils';
import style from './AudioPlayer.module.scss';

dayjs.extend(duration);

export type AudioPlayerProps = {
  src: string;
  showAlbumCover?: boolean;
};

interface AudioPlayerMetadata {
  title: string;
  artist: string;
  album: string;
  artwork: string | null;
}

interface AudioPlayerStore {
  isPlaying: boolean;
  volume: number;

  currentTime: number;
  duration: number;
}

function formatTime(seconds: number) {
  const duration = dayjs.duration(seconds, 'seconds');
  const formattedDuration = duration.format('mm:ss');

  return formattedDuration;
}

const defaultAudioPlayerStore: AudioPlayerStore = {
  isPlaying: false,
  volume: 0.3,

  currentTime: 0,
  duration: 0,
};

const defaultAudioPlayerMetadata = {
  title: '',
  artist: '',
  album: '',
  artwork: null,
};

async function fetchMetadata(src: string): Promise<AudioPlayerMetadata> {
  const abortController = new AbortController();
  const response = await fetch(src, {
    signal: abortController.signal,
  });

  const metadata = await parseWebStream(response.body!);
  abortController.abort();

  const artwork = metadata.common.picture?.[0];

  return {
    title: metadata.common.title ?? defaultAudioPlayerMetadata.title,
    artist: metadata.common.artist ?? defaultAudioPlayerMetadata.artist,
    album: metadata.common.album ?? defaultAudioPlayerMetadata.album,
    artwork: artwork
      ? `data:${artwork.format};base64,${bytesToBase64(artwork.data)}`
      : null,
  };
}

const defaultProps: RequiredDefaults<AudioPlayerProps> = {
  showAlbumCover: true,
};

export const AudioPlayer: Component<AudioPlayerProps> = (userProps) => {
  const props = mergeProps(defaultProps, userProps);

  let audioRef: HTMLAudioElement | undefined;
  let volumeRef: HTMLInputElement | undefined;

  const volumeSliderSteps = 10;
  const [state, setState] = createStore<AudioPlayerStore>(
    structuredClone(defaultAudioPlayerStore),
  );
  const [metadata, { refetch: refetchMetadata }] = createResource(
    props.src,
    fetchMetadata,
    {
      initialValue: defaultAudioPlayerMetadata,
      ssrLoadFrom: 'initial',
      onHydrated() {
        refetchMetadata();
      },
    },
  );

  const durationString = createMemo(() => formatTime(state.duration ?? 0));
  const currentTimeString = createMemo(() => formatTime(state.currentTime));

  function setVolume(volume: number) {
    setState('volume', Math.min(Math.max(0, volume), 1));

    if (audioRef) {
      audioRef.volume = state.volume;
    }
  }

  function togglePlay() {
    if (!audioRef) {
      if (isDev()) {
        console.warn('Audio element is not defined');
      }

      return;
    }

    if (state.isPlaying) {
      audioRef.pause();
    } else {
      audioRef.play();

      const meta = metadata();

      if (meta) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          artwork: [
            {
              src: meta.album,
            },
          ],
        });
      }
    }

    setState('isPlaying', (prev) => !prev);
  }

  const setProgress = (value: number) => {
    if (audioRef) {
      setState('currentTime', value);
      audioRef.currentTime = value;
    }
  };

  const handleVolumeChange = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      const newVolume = Number.parseFloat(event.target.value);
      setVolume(newVolume);
    }
  };

  const handleVolumeScroll = (event: WheelEvent) => {
    if (audioRef && volumeRef) {
      setVolume(state.volume + event.deltaY / 100 - event.deltaX / 100);
    }
  };

  onMount(() => {
    if (volumeRef) {
      const newVolume = Number.parseFloat(volumeRef.value);
      setVolume(newVolume);
    }

    if (isServer === false && audioRef) {
      if (Number.isNaN(audioRef.duration) === false) {
        setState('duration', audioRef.duration);
      }

      audioRef.addEventListener('loadedmetadata', () => {
        setState('duration', audioRef.duration);
      });

      audioRef.addEventListener('timeupdate', () => {
        setState('currentTime', audioRef.currentTime);
      });
    }
  });

  return (
    <Widget title="Audio Player">
      <div class={style.playerContainer}>
        <div class={style.container}>
          <TextMarquee>
            <Switch fallback="Unknown media">
              <Match when={metadata().title && metadata().artist}>
                {metadata().title} - {metadata().artist}
              </Match>

              <Match when={metadata().title}>{metadata().title}</Match>

              <Match when={metadata().artist}>
                Unknown track - {metadata().artist}
              </Match>
            </Switch>
          </TextMarquee>

          <ProgressBar
            value={state.currentTime}
            valueSetter={setProgress}
            max={state.duration}
          />

          <div class={style.lowerControls}>
            <audio ref={audioRef} src={props.src} preload="metadata">
              <track kind="captions" />
            </audio>

            <button type="button" onClick={togglePlay}>
              <MaterialSymbol
                symbol={state.isPlaying ? 'pause' : 'play_arrow'}
                color="gray"
                active={true}
                highlightColor="gray"
                interactive={true}
              />
            </button>

            <div>
              {currentTimeString()}/{durationString()}
            </div>

            <div
              classList={{
                [style.volumeContainer]: true,
                [style.muted]: state.volume === 0,
              }}
              onWheel={handleVolumeScroll}
            >
              <div class={style.volumeDisplay}>
                <For each={Array.from({ length: volumeSliderSteps + 1 })}>
                  {(_item, index) => (
                    <span
                      classList={{
                        [style.volumeIndicator]: true,
                        [style.active]:
                          index() + 1 <= state.volume * volumeSliderSteps + 1,
                        [style.first]: index() === 0,
                      }}
                    />
                  )}
                </For>
              </div>

              <input
                ref={volumeRef}
                type="range"
                min="0"
                max="1"
                step={1 / volumeSliderSteps}
                value={state.volume}
                onInput={handleVolumeChange}
                class={style.volumeSlider}
              />
            </div>
          </div>
        </div>

        <Show when={props.showAlbumCover}>
          <Divider direction="vertical" connect={0b11} />

          <div class={style.albumCoverContainer}>
            <img
              class={style.albumCover}
              src={metadata()?.artwork ?? albumCover}
              aria-label="Album artwork"
            />
          </div>
        </Show>
      </div>
    </Widget>
  );
};
