import {Quality} from "@prisma/client";

interface ISegmentPlaylist {
    fileName: string;
    start: number;
    duration: number;
}

interface IPlaylist {
    initSegmentUrl: string;
    segments: ISegmentPlaylist[];
    duration: number;
}

interface IHSLResponse {
    hasAudio: boolean;
    duration: number;
    quality: Quality[];
}

export type { IPlaylist, ISegmentPlaylist, IHSLResponse };