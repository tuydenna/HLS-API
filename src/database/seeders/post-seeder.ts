import db from "@lib/prisma/db-connector";
import {faker} from "@faker-js/faker";
import {PostStatus} from "@prisma/client";
import * as process from "node:process";
import {getProcessArgsObj} from "@database/hepler/node-process";

(async function () {
    try {
        const seedCount: number = +getProcessArgsObj<{loop?: string}>(process.argv)?.loop || 100 
        for (let i = 0; i < seedCount; i++) {
            const file = await db.file.create({
                data:  {
                    "dirPath": "/videos/channel-13380f69-369b-46fc-bbf3-fb7d16aac998/8633202f-bc20-400e-86b8-04ddb1e5bb2f",
                    "duration": 238.8886489999999,
                    "filePath": "/videos/channel-13380f69-369b-46fc-bbf3-fb7d16aac998/8633202f-bc20-400e-86b8-04ddb1e5bb2f/original.mp4",
                    "size": 73166952
                }
            })
            await db.post.create({
                data: {
                    authorId: "686cebd33716c4ba2afb7296",
                    videoId: file.id,
                    slug: faker.string.sample(),
                    title: faker.music.songName(),
                    description: faker.person.bio(),
                    thumbnail: "/thumbnail/f5b3ef24-34d0-43ea-bb8b-5b4270fa09e0.png",
                    status: PostStatus.PUBLISHED
                }
            });
        }
        console.log("[Post Seeder]:", seedCount, "seeded successfully in", process.uptime(), "s");
    } catch (e) {
        console.log("[Post Seeder]:", "Error", e);
        process.exit()
    }
})()