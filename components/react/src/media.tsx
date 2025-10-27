'use client';

import React from 'react';
import { Client, type ClientConfig, type MediaExtended } from '@thebcms/client';
import type { Media, PropMediaDataParsed } from '@thebcms/types';
import {
    BCMSVideo,
    type BCMSVideoProps,
} from '@thebcms/components-react/video';
import {
    BCMSAudio,
    type BCMSAudioProps,
} from '@thebcms/components-react/audio';
import {
    BCMSImage,
    type BCMSImageProps,
} from '@thebcms/components-react/image';

export interface BCMSMediaProps {
    id?: string;
    className?: string;
    style?: React.HTMLAttributes<HTMLAudioElement>['style'];
    media: Media | MediaExtended | PropMediaDataParsed;
    clientConfig: ClientConfig;
    videoProps?: Omit<
        BCMSVideoProps,
        'id' | 'class' | 'style' | 'media' | 'clientConfig'
    >;
    audioProps?: Omit<
        BCMSAudioProps,
        'id' | 'class' | 'style' | 'media' | 'clientConfig'
    >;
    imageProps?: Omit<
        BCMSImageProps,
        'id' | 'class' | 'style' | 'media' | 'clientConfig'
    >;
}

export const BCMSMedia: React.FC<BCMSMediaProps> = (props) => {
    if (
        props.media.type === 'IMG' ||
        props.media.type === 'SVG' ||
        props.media.type === 'GIF'
    ) {
        const p = props.imageProps || {};
        const a = {
            ...props,
            ...p,
        };
        return <BCMSImage {...a} />;
    } else if (props.media.type === 'VID') {
        const p = props.videoProps || {};
        const a = {
            ...props,
            ...p,
        };
        return <BCMSVideo {...a} />;
    } else if (props.media.type === 'AUDIO') {
        const p = props.videoProps || {};
        const a = {
            ...props,
            ...p,
        };
        return <BCMSAudio {...a} />;
    } else {
        const client = new Client(
            props.clientConfig.orgId,
            props.clientConfig.instanceId,
            props.clientConfig.apiKey,
            {
                cmsOrigin: props.clientConfig.cmsOrigin,
                useMemCache: props.clientConfig.useMemCache,
                injectSvg: props.clientConfig.injectSvg,
                debug: props.clientConfig.debug,
                enableSocket: props.clientConfig.enableSocket,
            },
        );
        const origin = client.cmsOrigin.includes('app.thebcms.com')
            ? 'https://cdn.thebcms.com'
            : client.cmsOrigin;
        return (
            <iframe
                style={props.style}
                id={props.id}
                className={`bcms-iframe ${props.className || ''}`}
                src={
                    origin +
                    client.media.toUri(props.media._id, props.media.name)
                }
            />
        );
    }
};
