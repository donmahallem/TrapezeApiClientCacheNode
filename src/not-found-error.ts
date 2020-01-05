/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

/**
 * Error object with an attached statusCode
 */
export class NotFoundError extends Error {
    public readonly statusCode: number = 404;
    public constructor(msg: string) {
        super(msg);
    }
}
