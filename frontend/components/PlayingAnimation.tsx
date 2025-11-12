'use client';

import './PlayingAnimation.css';

interface PlayingAnimationProps {
  size?: number;
  color?: string;
}

export default function PlayingAnimation({ size = 16, color = 'white' }: PlayingAnimationProps) {
  return (
    <div
      className="playing-animation"
      style={{
        height: size,
        width: size,
        ['--bar-color' as string]: color,
      }}
    >
      <div className="bar bar1" />
      <div className="bar bar2" />
      <div className="bar bar3" />
    </div>
  );
}
