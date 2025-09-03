export default class ErrorException extends Error {
    static BAD_REQUEST_CODE: number = 400;
    static END_STREAM_CODE: number = 204;
    readonly code: number;

    constructor(message: string = "Internal Error", code: number = 500) {
        super(message);
        this.code = code;
    }
}