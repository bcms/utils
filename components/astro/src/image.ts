import type { Media } from '@thebcms/types';
import { Client, type ClientConfig, ImageHandler } from '@thebcms/client';

class BcmsImageComponent extends HTMLElement {
    resize: () => void = () => {};

    connectedCallback() {
        const clientConfig: ClientConfig = JSON.parse(
            this.dataset.clientConfig as string,
        );
        const client = new Client(
            clientConfig.orgId,
            clientConfig.instanceId,
            clientConfig.apiKey,
            {
                cmsOrigin: clientConfig.cmsOrigin,
                useMemCache: clientConfig.useMemCache,
                injectSvg: clientConfig.injectSvg,
                debug: clientConfig.debug,
                enableSocket: clientConfig.enableSocket,
            },
        );
        const media: Media = JSON.parse(this.dataset.media as string);
        const imageHandler = new ImageHandler(client, media);
        const imageElement = this.querySelector('img');
        if (!imageElement) {
            return;
        }
        let debounce: NodeJS.Timeout | undefined = undefined;
        const resize = () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                if (!imageElement) {
                    return;
                }
                const srcSet = imageHandler.getPictureSrcSet(
                    imageElement.offsetWidth,
                );
                this.children[0].children[0].setAttribute(
                    'srcset',
                    srcSet.src1,
                );
                this.children[0].children[1].setAttribute(
                    'srcset',
                    srcSet.src2,
                );
                this.children[0].children[2].setAttribute(
                    'width',
                    srcSet.width + '',
                );
                this.children[0].children[2].setAttribute(
                    'height',
                    srcSet.height + '',
                );
            }, 20);
        };
        this.resize = resize;
        window.addEventListener('resize', resize);
        resize();
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.resize);
    }
}

customElements.define('bcms-image', BcmsImageComponent);
