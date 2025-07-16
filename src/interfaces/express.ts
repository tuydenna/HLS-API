import {Request} from "express";

type RequestQuery<T> = Request<null, null, null, T>;
type RequestBody<T> = Request<null, null, T, null>;
type RequestParam<T> = Request<T, null, null, null>;
type RequestParamNBody<P, B> = Request<P, null, B, null>;

export type {RequestQuery, RequestBody, RequestParam, RequestParamNBody}