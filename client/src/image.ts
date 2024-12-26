import type { Client } from '@thebcms/client/main';
import type { MediaExtended } from '@thebcms/client/handlers';
import { Buffer } from 'buffer';
import type { Media, PropMediaDataParsed } from '@thebcms/types';

export interface ImageHandlerPictureSrcSetResult {
    original: string;
    src1: string;
    src2: string;
    width: number;
    height: number;
}

export class ImageHandler {
    parsable: boolean;
    fileName: string;
    fileExtension: string;

    constructor(
        private client: Client,
        private media: MediaExtended | Media | PropMediaDataParsed,
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
        for (let i = 0; i < sizeTransforms.length; i++) {
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
        return sizeTransforms[bestOptionIndex];
    }

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
