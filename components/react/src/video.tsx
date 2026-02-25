import React from 'react';
import { Client, type ClientConfig, type MediaExtended } from '@thebcms/client';
import type { Media, PropMediaDataParsed } from '@thebcms/types';

export interface BCMSVideoProps {
    id?: string;
    className?: string;
    style?: React.HTMLAttributes<HTMLVideoElement>['style'];
    media: Media | MediaExtended | PropMediaDataParsed;
    clientConfig: ClientConfig;
    controls?: boolean;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    playsinline?: boolean;
}

export const BCMSVideo: React.FC<BCMSVideoProps> = (props) => {
    const client = new Client({
        apiKey: `${props.clientConfig.apiKey.id}.${props.clientConfig.apiKey.secret}.${props.clientConfig.instanceId}`,
        cmsOrigin: props.clientConfig.cmsOrigin,
        useMemCache: props.clientConfig.useMemCache,
        injectSvg: props.clientConfig.injectSvg,
        debug: props.clientConfig.debug,
        enableSocket: props.clientConfig.enableSocket,
    });
    if (props.media.type !== 'VID') {
        return (
            <div
                style={{ display: 'none' }}
                data-bcms-video-error={`Media of type ${props.media.type} cannot used as video`}
            />
        );
    }
    const origin = client.cmsOrigin.includes('app.thebcms.com')
        ? 'https://cdn.thebcms.com'
        : client.cmsOrigin;
    return (
        <video
            id={props.id}
            style={props.style}
            className={`bcms-video ${props.className || ''}`}
            controls={props.controls}
            autoPlay={props.autoplay}
            loop={props.loop}
            muted={props.muted}
            playsInline={props.playsinline}
        >
            <source
                src={
                    origin +
                    client.media.toUri(props.media._id, props.media.name)
                }
                type={props.media.mimetype}
            />
        </video>
    );
};
