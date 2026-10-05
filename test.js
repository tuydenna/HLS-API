let errCount = 0;
const baseURL = "http://192.168.1.37:3080/api";
(
    async function () {
        let token = "";
        const user = await fetch(`${baseURL}/authentications/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({username: "admin@gmail.com", password: "123"}),
            }
        ).then(res => res.json());
        token = user.data.token;

        for (let i = 0; i <10; i++) {
            try {
                const data = await fetch(`${baseURL}/searches/posts`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Cookie: `auth_token=${token}`,
                        }
                    }
                ).then(res => res.json());
                console.log("data", data);
            } catch (e) {
                errCount++;
                console.error("error count: ", errCount, e.message);
             }
        }
    }
)()

console.log(.1 + .1);