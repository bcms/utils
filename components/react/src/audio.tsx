'use client';

import React from 'react';
import { Client, type ClientConfig, type MediaExtended } from '@thebcms/client';
import type { Media, PropMediaDataParsed } from '@thebcms/types';

export interface BCMSAudioProps {
    id?: string;
    className?: string;
    style?: React.HTMLAttributes<HTMLAudioElement>['style'];
    media: Media | MediaExtended | PropMediaDataParsed;
    clientConfig: ClientConfig;
    controls?: boolean;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    playsinline?: boolean;
}

export const BCMSAudio: React.FC<BCMSAudioProps> = (props) => {
    const client = new Client({
        apiKey: `${props.clientConfig.apiKey.id}.${props.clientConfig.apiKey.secret}.${props.clientConfig.instanceId}`,
        cmsOrigin: props.clientConfig.cmsOrigin,
        useMemCache: props.clientConfig.useMemCache,
        injectSvg: props.clientConfig.injectSvg,
        debug: props.clientConfig.debug,
        enableSocket: props.clientConfig.enableSocket,
    });

    if (props.media.type !== 'AUDIO') {
        return (
            <div
                style={{
                    display: 'none',
                }}
                data-bcms-video-error={`Media of type ${props.media.type} cannot used as audio`}
            />
        );
    }
    const origin = client.cmsOrigin.includes('app.thebcms.com')
        ? 'https://cdn.thebcms.com'
        : client.cmsOrigin;
    return (
        <audio
            id={props.id}
            style={props.style}
            className={`bcms-audio ${props.className || ''}`}
            controls={props.controls}
            autoPlay={props.autoplay}
            loop={props.loop}
            muted={props.muted}
        >
            <source
                src={
                    origin +
                    client.media.toUri(props.media._id, props.media.name)
                }
                type={props.media.mimetype}
            />
        </audio>
    );
};
