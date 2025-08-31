export const SupportedMaterialSymbol = [
  'question_mark',
  'cloud_upload',
  'check_box',
  'folder',
  'folder_open',
  'draft',
  'music_note',
  'description',
  'movie',
  'play_arrow',
  'pause',
  'broken_image',
  'swap_vert',
  'arrow_upward',
  'arrow_downward',
] as const;

export type SupportedMaterialSymbol = (typeof SupportedMaterialSymbol)[number];
