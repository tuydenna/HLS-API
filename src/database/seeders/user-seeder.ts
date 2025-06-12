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
            size: +faker.commerce.price(),
            dir_path: "din/song-1"
        }
    })

    const post = await db.post.create({
        data: {
                authorId: user.id,
                videoId: file.id,
                slug: faker.string.sample(),
                title: faker.music.songName(),
                description: faker.person.bio(),
                thumbnail: "/thumbnail/thumbnail-1724322681816-729526334.png"
            }
    });

    await db.userPost.create({data: {userId: user.id, postId: post.id}})
})()