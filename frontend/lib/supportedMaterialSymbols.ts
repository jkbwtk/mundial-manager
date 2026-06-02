export const MaterialSymbolCodepoints = {
  question_mark: 'eb8b',
  cloud_upload: 'e2c3',
  check_box: 'e834',
  folder: 'e2c7',
  folder_open: 'e2c8',
  draft: 'e66d',
  music_note: 'e405',
  description: 'e873',
  movie: 'e404',
  play_arrow: 'e037',
  pause: 'e034',
  broken_image: 'e3ad',
  swap_vert: 'e8d5',
  arrow_upward: 'e5d8',
  arrow_downward: 'e5db',
  atr: 'ebc7',
  stars_2: 'f31c',
  trending_up: 'e8e5',
  deblur: 'eb77',
  delete: 'e92e',
  handyman: 'f10b',
  sports_soccer: 'ea2f',
  swap_horiz: 'e8d4',
  display_external_input: 'f7e7',
  nearby_error: 'f03b',
  info: 'e88e',
  check_circle: 'f0be',
  warning: 'f083',
  error: 'f8b6',
  keyboard_arrow_down: 'e313',
  keyboard_arrow_up: 'e316',
  arrow_drop_down: 'e5c5',
  arrow_drop_up: 'e5c7',
  calendar_month: 'ebcc',
  keyboard_arrow_left: 'e314',
  keyboard_arrow_right: 'e315',
  keyboard_double_arrow_left: 'eac3',
  keyboard_double_arrow_right: 'eac9',
  refresh: 'e5d5',
  bug_report: 'e868',
  timer: 'e425',
  memory: 'e322',
  code: 'e86f',
  home: 'e9b2',
  select_all: 'e162',
  remove_selection: 'e9d5',
  arrow_forward: 'e5c8',
  leaderboard: 'f20c',
  trophy: 'ea23',
  editor_choice: 'f528',
  moon_stars: 'f34f',
  cyclone: 'ebd5',
  shield: 'e9e0',
  gps_fixed: 'e55c',
  local_fire_department: 'ef55',
  sentiment_very_dissatisfied: 'e814',
  science: 'ea4b',
  timer_play: 'f4ba',
  table_restaurant: 'eac6',
  date_range: 'e916',
  admin_panel_settings: 'ef3d',
  dashboard: 'e871',
  groups: 'f233',
  search: 'e8b6',
} as const;

export type SupportedMaterialSymbol = keyof typeof MaterialSymbolCodepoints;

export const SupportedMaterialSymbols = Object.keys(
  MaterialSymbolCodepoints,
) as SupportedMaterialSymbol[];

export const SegmentedMaterialSymbols = {
  all: [SupportedMaterialSymbols],
} as const satisfies Record<string, SupportedMaterialSymbol[][]>;

export function getMaterialSymbolGlyph(
  symbol: SupportedMaterialSymbol,
): string {
  return String.fromCodePoint(
    Number.parseInt(MaterialSymbolCodepoints[symbol], 16),
  );
}
