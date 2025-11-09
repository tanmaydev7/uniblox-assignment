import { ErrorRequestHandler } from "express"

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.log(err)

    const statusCode = typeof err?.code == 'string'? 500 : (err.code ?? 500)

    return res.status(statusCode).send({message: err.message})
}

export class CodedError extends Error {
    code: number;

    constructor(message: string, code: number) {
        super(message);
        this.code = code;
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export const generateFailureResponse = (message: string, code:number = 500) => {
    throw new CodedError(message, code)
}
