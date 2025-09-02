
function formatPlaylistM3u8APIEndPoint(txtBuffer: Buffer, apiEndPoint: string, scale?: string): Buffer {
    let txt: string = txtBuffer.toString();
    txt = txt.toString();
    if (scale) {
        txt = txt.replace(/".*(init.mp4)"/g, apiEndPoint+"$1?scale="+scale)
        txt = txt.replace(/(seg_.*.m4s)/g, apiEndPoint+"$1?scale="+scale)
    } else {
        txt = txt.replace(/".*(init.mp4)"/g, apiEndPoint+"$1")
        txt = txt.replace(/(seg_.*.m4s)/g, apiEndPoint+"$1")
    }

    return Buffer.from(txt);
}

function formatMasterM3u8APIEndPoint(txtBuffer: Buffer, apiEndPoint: string): Buffer {
    let txt: string = txtBuffer.toString();
    txt = txt.toString()
    txt = txt.replace(/(.*p)\\.*p.m3u8/g, apiEndPoint + "?scale=$1")
    return Buffer.from(txt);
}

export {formatPlaylistM3u8APIEndPoint, formatMasterM3u8APIEndPoint};