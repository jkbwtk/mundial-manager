declare module 'subset-font' {
  export default function subsetFont(
    font: Buffer,
    text: string,
    options?: { targetFormat?: 'sfnt' | 'woff' | 'woff2' },
  ): Promise<Buffer>;
}

declare module 'fontverter' {
  const fontverter: {
    convert: (
      font: Buffer,
      format: 'sfnt' | 'woff' | 'woff2',
    ) => Promise<Buffer>;
  };

  export default fontverter;
}

declare module 'harfbuzzjs' {
  interface HarfBuzzBlob {
    destroy: () => void;
  }

  interface HarfBuzzFace {
    collectUnicodes: () => Uint32Array;
    destroy: () => void;
  }

  const harfbuzz: Promise<{
    createBlob: (data: Uint8Array) => HarfBuzzBlob;
    createFace: (blob: HarfBuzzBlob, index: number) => HarfBuzzFace;
  }>;

  export default harfbuzz;
}
