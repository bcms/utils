'use client';

import React from 'react';
import {
    type Media,
    type MediaType,
    type PropMediaDataParsed,
} from '@thebcms/client/types';
import {
    Client,
    ImageHandler,
    type ImageHandlerOptions,
    type MediaExtended,
} from '@thebcms/client';

export interface BCMSImageProps {
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    media: Media | MediaExtended | PropMediaDataParsed;
    client: Client;
    options?: ImageHandlerOptions;
    altText?: string;
}

const allowedMediaTypes: (keyof typeof MediaType)[] = ['IMG', 'SVG'];

export const BCMSImage: React.FC<BCMSImageProps> = (props) => {
    const imageElement = React.useRef<HTMLImageElement | null>(null);
    const imageHandler = React.useMemo(
        () => new ImageHandler(props.client, props.media, props.options),
        [props.media, props.options, props.client],
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
                    const parent = imageElement.current.parentElement;
                    if (parent) {
                        setSrcSet(
                            imageHandler.getPictureSrcSet(parent.offsetWidth),
                        );
                    }
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
    }, [props.media, props.options, imageHandler]);

    if (props.client.injectSvg && mediaExtended.svg) {
        return (
            <div
                id={props.id}
                style={props.style}
                className={props.className}
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
            // eslint-disable-next-line @next/next/no-img-element
            <img
                id={props.id}
                style={props.style}
                className={props.className}
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
                className={props.className}
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
