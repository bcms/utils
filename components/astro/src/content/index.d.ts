import type { ComponentInstance } from 'astro/dist/types/astro';

export interface BCMSWidgetComponents {
    [bcmsWidgetName: string]: ComponentInstance
}