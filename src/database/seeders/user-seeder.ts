import db from "../../config/database/db";
import {faker} from "@faker-js/faker";

(async function () {

    const user = await db.user.create({
        data: {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            avatar: faker.image.avatarGitHub()
        }
    });

    const file = await db.file.create({
        data: {
            title: faker.music.songName(),
            size: +faker.commerce.price(),
            path: faker.image.avatarGitHub()
        }
    })

    const post = await db.post.create({
        data: {
                authorId: user.id,
                videoId: file.id,
                slug: faker.string.sample(),
                title: faker.music.songName(),
                description: faker.person.bio(),
                thumbnail: faker.image.avatarGitHub()
            }
    });

    await db.userPost.create({data: {userId: user.id, postId: post.id}})
})()