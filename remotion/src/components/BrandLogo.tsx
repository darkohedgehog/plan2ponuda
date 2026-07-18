import {Img, staticFile, useCurrentFrame} from 'remotion';
import {ASSETS} from '../constants';
import {easedInterpolate} from '../helpers/animation';

type BrandLogoProps = {
  startFrame?: number;
  width?: number;
};

export const BrandLogo = ({startFrame = 2, width = 760}: BrandLogoProps) => {
  const frame = useCurrentFrame();
  const opacity = easedInterpolate(
    frame,
    [startFrame, startFrame + 18],
    [0, 1],
  );
  const scale = easedInterpolate(
    frame,
    [startFrame, startFrame + 24],
    [0.94, 1],
  );
  const blur = easedInterpolate(
    frame,
    [startFrame, startFrame + 18],
    [16, 0],
  );

  return (
    <div
      style={{
        position: 'relative',
        width,
        aspectRatio: 1.5,
        borderRadius: 32,
        overflow: 'hidden',
        background: '#fff',
        opacity,
        filter: `blur(${blur}px)`,
        transform: `scale(${scale})`,
        boxShadow:
          '0 34px 100px rgba(0,0,0,0.48), 0 0 96px rgba(20,99,255,0.35)',
      }}
    >
      <Img
        src={staticFile(ASSETS.logo)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};
