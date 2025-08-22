
function formatM3u8APIEndPoint(txtBuffer: Buffer, apiEndPoint: string): Buffer {
    let txt: string = txtBuffer.toString();
    txt = txt.toString()
    txt = txt.replace(/".*(init.mp4)"/g, `"${apiEndPoint+"$1"}"`)
    txt = txt.replace(/(seg_.*.m4s)/g, apiEndPoint+"$1")
    return Buffer.from(txt);
}

export {formatM3u8APIEndPoint};