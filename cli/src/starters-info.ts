import axios from 'axios';

export interface StartersInfoFramework {
    id: string;
    title: string;
    available: boolean;
}

export interface StartersInfoStarter {
    available: boolean;
    title: string;
    slug: string;
    frameworks: string[];
}

export interface StartersInfo {
    saas: {
        frameworks: StartersInfoFramework[];
        starters: StartersInfoStarter[];
    };
}

export async function getStartersInfo(): Promise<StartersInfo> {
    const res = await axios({
        url: 'https://raw.githubusercontent.com/bcms/starters/refs/heads/master/info.json',
    });
    return res.data;
}
