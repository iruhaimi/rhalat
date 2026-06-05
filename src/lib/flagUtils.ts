type FlagSource = {
  code?: string | null;
  flag_url?: string | null;
  flagUrl?: string | null;
};

const FLAGCDN_PNG_PATTERN = /^https:\/\/flagcdn\.com\/w\d+\/([a-z]{2,3})\.png$/i;
const FLAGCDN_SVG_PATTERN = /^https:\/\/flagcdn\.com\/([a-z]{2,3})\.svg$/i;

export function getSharpFlagUrl(source: FlagSource, fallbackWidth = 640): string {
  const code = source.code?.toLowerCase();
  const rawUrl = source.flag_url || source.flagUrl || '';

  if (code && code !== 'schengen') {
    return `https://flagcdn.com/${code}.svg`;
  }

  const pngMatch = rawUrl.match(FLAGCDN_PNG_PATTERN);
  if (pngMatch?.[1]) {
    return `https://flagcdn.com/${pngMatch[1].toLowerCase()}.svg`;
  }

  const svgMatch = rawUrl.match(FLAGCDN_SVG_PATTERN);
  if (svgMatch?.[1]) {
    return rawUrl;
  }

  return rawUrl || `https://flagcdn.com/w${fallbackWidth}/un.png`;
}