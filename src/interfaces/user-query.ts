import {Prisma} from "@prisma/client";

type PostWithAuthorAndVideo = Prisma.PostGetPayload<{
    include: {
       author: true,
        video: true
    };
}>;

export type {PostWithAuthorAndVideo};