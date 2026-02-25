'use client';

import React from 'react';
import {
    Client,
    type ClientConfig,
    ImageHandler,
    type MediaExtended,
} from '@thebcms/client';
import type { Media, MediaType, PropMediaDataParsed } from '@thebcms/types';

export interface BCMSImageProps {
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    media: Media | MediaExtended | PropMediaDataParsed;
    clientConfig: ClientConfig;
    altText?: string;
    sizeTransform?: string[];
}

const allowedMediaTypes: (keyof typeof MediaType)[] = ['IMG', 'SVG', 'GIF'];

export const BCMSImage: React.FC<BCMSImageProps> = (props) => {
    const client = new Client({
        apiKey: `${props.clientConfig.apiKey.id}.${props.clientConfig.apiKey.secret}.${props.clientConfig.instanceId}`,
        cmsOrigin: props.clientConfig.cmsOrigin,
        useMemCache: props.clientConfig.useMemCache,
        injectSvg: props.clientConfig.injectSvg,
        debug: props.clientConfig.debug,
        enableSocket: props.clientConfig.enableSocket,
    });
    const imageElement = React.useRef<HTMLImageElement | null>(null);
    const imageHandler = React.useMemo(
        () => new ImageHandler(client, props.media, props.sizeTransform),
        [props.media, client, props.sizeTransform],
    );
    const [srcSet, setSrcSet] = React.useState(
        /**
         * By default, get the smallest image in the set.
         * When DOM is loaded, we will be able to get
         * size of the parent element that is holding the
         * image and calculate the best image size that
         * should be in it.
         *
         * This will ensure that first page load is not
         * impacted by large image and then when page is
         * loaded, higher resolution images will be loaded
         * if required.
         */
        imageHandler.getPictureSrcSet(0),
    );

    /**
     * Have in mind that media does not have to be of type MediaExtended
     */
    const mediaExtended = props.media as MediaExtended;

    React.useEffect(() => {
        let debounce: any = undefined;
        function resizeHandler() {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                if (imageElement.current) {
                    setSrcSet(
                        imageHandler.getPictureSrcSet(
                            imageElement.current.offsetWidth,
                        ),
                    );
                }
            });
        }
        resizeHandler();

        if (imageHandler.parsable) {
            window.addEventListener('resize', resizeHandler);
        }
        return () => {
            if (imageHandler.parsable) {
                window.removeEventListener('resize', resizeHandler);
            }
        };
    }, [props.media]);

    if (client.injectSvg && mediaExtended.svg) {
        return (
            <div
                id={props.id}
                style={props.style}
                className={`bcms-image ${props.className || ''}`}
                dangerouslySetInnerHTML={{ __html: mediaExtended.svg }}
            />
        );
    }
    if (!allowedMediaTypes.includes(props.media.type)) {
        const message = `Media of type ${props.media.type} cannot be used as image`;
        console.warn(message);
        return (
            <div data-bcms-image-error={message} style={{ display: 'none' }} />
        );
    }

    if (!imageHandler.parsable) {
        return (
            <img
                id={props.id}
                style={props.style}
                className={`bcms-image ${props.className || ''}`}
                src={srcSet.original}
                alt={
                    props.altText ||
                    (props.media as PropMediaDataParsed).alt_text ||
                    (props.media as Media).altText ||
                    props.media.name
                }
                width={props.media.width}
                height={props.media.height}
            />
        );
    }

    return (
        <picture>
            <source srcSet={srcSet.src1} type={'image/webp'} />
            <source srcSet={srcSet.src2} type={props.media.mimetype} />
            <img
                ref={imageElement}
                id={props.id}
                style={
                    props.style
                        ? props.style
                        : props.className
                          ? {}
                          : {
                                width: '100%',
                            }
                }
                className={`bcms-image ${props.className || ''}`}
                src={srcSet.original}
                alt={
                    props.altText ||
                    (props.media as PropMediaDataParsed).alt_text ||
                    (props.media as Media).altText ||
                    props.media.name
                }
                width={srcSet.width}
                height={srcSet.height}
            />
        </picture>
    );
};
