export default class ErrorException extends Error {
    constructor(message: string = "Internal Error", private code: number = 500) {
        super(message);
    }
}