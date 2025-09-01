import {IScaleSetting} from "@interfaces/video-config";

const ScaleSettings: Readonly<IScaleSetting[]> = [
    {
        "size": 360,
        "scale": {
            width: 640,
            height: 360
        }
    },
    {
        "size": 720,
        "scale": {
            width: 1280,
            height: 720
        }
    },
    {
        "size": 1080,
        "scale": {
            width: 1920,
            height: 1080
        }
    }
];

export {ScaleSettings};