import type { Act } from '../../lib/db/queries.ts';
import PlateVideo from './PlateVideo.tsx';

/**
 * An act's scenery, in depth-ordered layers.
 *
 * Phase 3 fills these with generated anime art from the media library. Until
 * then each layer falls back to a CSS gradient, so the choreography can be
 * built and judged against real parallax rather than against nothing.
 *
 * Layers sit behind the content and are never announced — the story is carried
 * by the text, and this is set dressing.
 */
export default function Plate({ act }: { act: Act }) {
  const layers: { name: 'sky' | 'mid' | 'fore'; mediaId: number | null }[] = [
    { name: 'sky', mediaId: act.plateSkyMediaId },
    { name: 'mid', mediaId: act.plateMidMediaId },
    { name: 'fore', mediaId: act.plateForeMediaId },
  ];

  return (
    <div className="plate" aria-hidden="true">
      {layers.map(({ name, mediaId }) => (
        <div key={name} className="plate-layer" data-layer={name}>
          {mediaId && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/api/media/${mediaId}`}
              // The pipeline emits these widths; the media route serves AVIF to
              // browsers that accept it. A phone fetches tens of kilobytes here
              // rather than the full-size plate.
              srcSet={[960, 1600, 2400]
                .map((w) => `/api/media/${mediaId}?w=${w} ${w}w`)
                .join(', ')}
              sizes="100vw"
              alt=""
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
      ))}

      {act.loopMediaId && (
        <PlateVideo mediaId={act.loopMediaId} posterId={act.plateMidMediaId} />
      )}
    </div>
  );
}
