import type { Client } from '@thebcms/client/main';
import type { MediaExtended } from '@thebcms/client/handlers';
import { Buffer } from 'buffer';
import type { Media, PropMediaDataParsed } from '@thebcms/types';

export interface ImageHandlerPictureSrcSetResult {
    /**
     * URL of the original image
     */
    original: string;
    /**
     * WEBP transformed variant of an image
     */
    src1: string;
    /**
     * Original transformed variant of an image
     */
    src2: string;
    /**
     * Width of transformed image
     */
    width: number;
    /**
     * Height of transformed image
     */
    height: number;
}

/**
 * Utility class for media of type IMG.
 */
export class ImageHandler {
    /**
     * Can media be parsed
     */
    parsable: boolean;
    /**
     * Name of the file passed to the constructor
     */
    fileName: string;
    /**
     * Extension of the file passed to the constructor
     */
    fileExtension: string;

    constructor(
        /**
         * Instance of the BCMS Client
         */
        private client: Client,
        /**
         * Media for which to create handler
         */
        private media: MediaExtended | Media | PropMediaDataParsed,
        /**
         * Use only specified size transformations. This array
         * must be a subset of `media.sizeTransforms`
         */
        private sizeTransform?: string[],
    ) {
        this.parsable = !!media.sizeTransforms;
        const nameParts = this.media.name.split('.');
        this.fileName = encodeURIComponent(
            nameParts.slice(0, nameParts.length - 1).join('.'),
        );
        this.fileExtension = encodeURIComponent(
            nameParts[nameParts.length - 1],
        );
    }

    /**
     * Get size transformation options which is the best fit for
     * provided element width;
     */
    private closestSize(elementWidth: number): string | undefined {
        if (!this.media.sizeTransforms && !this.sizeTransform) {
            return undefined;
        }
        const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio;
        const containerWidth = elementWidth * dpr;
        let delta = 1000000;
        let bestOptionIndex = 0;
        const sizeTransforms = (this.sizeTransform ||
            this.media.sizeTransforms) as string[];
        if (sizeTransforms.length < 2) {
            return sizeTransforms[0];
        }
        for (let i = 0; i < sizeTransforms.length - 1; i++) {
            const [widthStr] = sizeTransforms[i].split('x');
            const width = parseInt(widthStr, 10);
            let widthDelta = containerWidth - width;
            if (widthDelta < 0) {
                widthDelta = -widthDelta;
            }
            if (widthDelta < delta) {
                delta = widthDelta;
                bestOptionIndex = i;
            }
        }
        if (sizeTransforms[bestOptionIndex + 1]) {
            const [currWidthStr] = sizeTransforms[bestOptionIndex].split('x');
            const currWidth = parseInt(currWidthStr, 10);
            if (currWidth < containerWidth) {
                bestOptionIndex++;
            }
        }
        return sizeTransforms[bestOptionIndex];
    }

    /**
     * Get SVG content for provided media file. If media file is
     * not of type SVG, this function will throw an error.
     */
    async getSvgContent(): Promise<string> {
        if (this.media.type !== 'SVG') {
            throw Error(
                'Provided media is not of type SVG -> ' +
                    JSON.stringify(this.media, null, 2),
            );
        }
        if ((this.media as MediaExtended).svg) {
            return (this.media as MediaExtended).svg as string;
        }
        const bin = await this.client.media.getMediaBin(
            this.media._id,
            this.media.name,
        );
        return Buffer.from(bin).toString();
    }

    /**
     * Returns a source set for provided media image. If media is not of type
     * IMG, this method will throw an error.
     */
    getPictureSrcSet(elementWidth: number): ImageHandlerPictureSrcSetResult {
        const closestSize = this.closestSize(elementWidth);
        let width = this.media.width;
        let height = this.media.height;
        if (closestSize) {
            const [widthStr, heightStr] = closestSize.split('x');
            width = parseInt(widthStr, 10);
            height = parseInt(heightStr, 10);
        }
        let cmsOrigin: string;
        if (this.client.cmsOrigin.startsWith('https://app.thebcms.com')) {
            cmsOrigin = `https://cdn.thebcms.com`;
        } else {
            cmsOrigin = this.client.cmsOrigin;
        }
        return {
            original: `${cmsOrigin}${this.client.media.toUri(this.media._id, this.media.name)}`,
            src1: `${cmsOrigin}${this.client.media.toUri(
                this.media._id,
                this.fileName + '.webp',
                closestSize
                    ? {
                          webp: true,
                          sizeTransform: closestSize,
                      }
                    : undefined,
            )}`,
            src2: `${cmsOrigin}${this.client.media.toUri(
                this.media._id,
                this.fileName + '.' + this.fileExtension,
                closestSize
                    ? {
                          sizeTransform: closestSize,
                      }
                    : undefined,
            )}`,
            width: parseInt(width.toFixed(0)),
            height:
                height !== -1
                    ? parseInt(height.toFixed(0))
                    : parseInt(
                          (
                              width /
                              (this.media.width / this.media.height)
                          ).toFixed(0),
                      ),
        };
    }
}
