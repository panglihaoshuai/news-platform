import { Composition } from 'remotion';
import { NewsVisualization } from './NewsVisualization';
import type { ComponentType } from 'react';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="NewsViz"
                component={NewsVisualization as ComponentType<{ news: never[] }>}
                durationInFrames={1800} // 60 seconds @ 30fps
                fps={30}
                width={1920}
                height={1080}
                defaultProps={{
                    news: [],
                }}
            />
        </>
    );
};
