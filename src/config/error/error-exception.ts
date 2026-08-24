export default class ErrorException extends Error {
    static BAD_REQUEST_CODE: number = 400;
    static END_STREAM_CODE: number = 204;
    static NOT_FOUND_CODE: number = 404;
    static INTERNAL_SERVER: number = 500;
    static SUCCESS: number = 200;
    readonly code: number;

    constructor(message: string = "Internal Error", code: number = 500) {
        super(message);
        this.code = code;
    }
}