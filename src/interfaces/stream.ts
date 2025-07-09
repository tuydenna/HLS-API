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

export type { IPlaylist, ISegmentPlaylist };