import db from "@lib/prisma/db-connector";
import {faker} from "@faker-js/faker";
import {CHANNEL_FOLDER_PREFIX} from "@constant/file-storage";

(async function () {

    const user = await db.user.create({
        data: {
            name: faker.person.fullName(),
            email: "admin@gmail.com",
            password: "$2b$10$1W5gPQ6TfToMaDin7Nf1ze7aiNyFkb8hOI/g0IoT.Ghoq5qPq734S",
            userDir: CHANNEL_FOLDER_PREFIX + crypto.randomUUID(),
            avatar: "/avatars/5c5664c3-c5cb-4b32-8bdb-8536b5ebf8f8.png"
        }
    });
})()