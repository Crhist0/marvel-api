import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import axios from "axios";
import md5 from "md5";
require("dotenv/config");

const app = express();
app.use(express.json());
app.use(cors());

const apiMarvel = axios.create({
    baseURL: "http://gateway.marvel.com/v1/public",
});

function createAuth() {
    const ts = new Date().getTime();
    const apikey = process.env.PUBLICKEY;
    const privatekey = process.env.PRIVATEKEY;
    const hash = md5(ts.toString() + privatekey + apikey);
    return {
        ts,
        apikey,
        hash,
    };
}

function spyApi(req: Request, searchTerm: string | undefined) {
    console.log(`O usuário de IP "${req.ip}", 
        buscou por "${searchTerm}".
        via "${req.method}" na URL "${req.url}${req.path}" por protocolo "${req.protocol}",
        Code: ${req.statusCode} - Message: ${req.statusMessage} - Complete: ${req.complete}`);
}

// offset = quanto por pagina
// page = pagina

app.get("/", async (req: Request, res: Response) => {
    try {
        console.log("req.query abaixo:");
        console.log(req.query);
        const page: number = req.query.page ? Number(req.query.page as string) : 1;
        const limit: number = req.query.limit ? Number(req.query.limit as string) : 25;
        console.log(`limit é = ${limit}`);

        const offset = limit * (page - 1);
        const name = req.query.name ? (req.query.name as string) : undefined;
        const apiResponse = await apiMarvel.get("/characters", {
            params: {
                ...createAuth(),
                limit,
                offset,
                nameStartsWith: name,
            },
        });
        console.log(spyApi(req, name));

        let characters = apiResponse.data.data.results;
        let characters2 = apiResponse.data.data.total;
        let bottomMessageHTML = `
        <a href=\"http://marvel.com\" class='text-center'>${apiResponse.data.attributionText}</a>`;
        // tentativa de pegar resources

        let resources = await apiMarvel.get("/characters", {
            params: {
                ...createAuth(),
                limit,
                offset,
                nameStartsWith: name,
            },
        });
        let searchResults = characters.map((character: any) => {
            return {
                name: character.name,
                thumbnail: character.thumbnail.path.toString() + "." + character.thumbnail.extension.toString(),
                comics: {
                    quantity: character.comics.available,
                },
                series: {
                    quantity: character.series.available,
                },
                stories: {
                    quantity: character.stories.available,
                },
                events: {
                    quantity: character.events.available,
                },
            };
        });
        let detailsPageResults = characters.map((character: any) => {
            let d = character.modified.slice(8, 10);
            let m = character.modified.slice(5, 7);
            let y = character.modified.slice(0, 4);
            function getUrl(listaDeUrls: Array<any>, type: string): string {
                let index = listaDeUrls.map((lista) => lista.type).indexOf(type);
                if (index == -1) {
                    return "";
                } else {
                    return listaDeUrls[index].url;
                }
            }
            let urlDetail = getUrl(character.urls, "detail");
            let urlWiki = getUrl(character.urls, "wiki");
            let urlComiclink = getUrl(character.urls, "comiclink");
            return {
                name: character.name,
                thumbnail: character.thumbnail.path.toString() + "." + character.thumbnail.extension.toString(),
                description: character.description,
                modified: d + "/" + m + "/" + y,
                detailsPage: urlDetail,
                wikiPage: urlWiki,
                comiclinkPage: urlComiclink,
                comics: character.comics,
                series: character.series,
                stories: character.stories,
                events: character.events,
            };
        });
        characters = characters.map((character: any) => {
            let d = character.modified.slice(8, 10);
            let m = character.modified.slice(5, 7);
            let y = character.modified.slice(0, 4);

            function getUrl(listaDeUrls: Array<any>, type: string): string {
                let index = listaDeUrls.map((lista) => lista.type).indexOf(type);
                if (index == -1) {
                    return "";
                } else {
                    return listaDeUrls[index].url;
                }
            }
            let urlDetail = getUrl(character.urls, "detail");
            let urlWiki = getUrl(character.urls, "wiki");
            let urlComiclink = getUrl(character.urls, "comiclink");

            return {
                id: character.id,
                name: character.name,
                thumbnail: character.thumbnail.path.toString() + "." + character.thumbnail.extension.toString(),
                comics: character.comics.available,
                description: character.description == "" ? `Description not found.` : character.description,
                lastModified: d + "/" + m + "/" + y,
                comicsList: character.comics.items,
                seriesList: character.series.items,
                storiesList: character.stories.items,
                eventsList: character.events.items,
                details: urlDetail,
                wiki: urlWiki,
                comiclink: urlComiclink,
            };
        });

        return res.status(200).send({
            message: "ok",
            data: characters,
            data2: characters2,
            searchResults,
            detailsPageResults,
            copy: bottomMessageHTML,
        });
    } catch (err: any) {
        return res.status(500).send({
            message: err.toString(),
        });
    }
});

app.get("/:id", async (req: Request, res: Response) => {
    try {
        // const page: number = req.query.page ? Number(req.query.page as string) : 1;
        // const limit: number = req.query.limit ? Number(req.query.limit as string) : 10;
        // const offset = limit * (page - 1);
        const id = req.params.id;
        const apiResponse = await apiMarvel.get(`/characters/${id}`, {
            params: {
                ...createAuth(),
                // limit,
                // offset,
                // characterId: id,
            },
        });
        console.log(spyApi(req, id));

        let character = apiResponse.data.data.results;

        let bottomMessageHTML = `
    <a href=\"http://marvel.com\" class='text-center'>${apiResponse.data.attributionText}</a>`;

        return res.status(200).send({
            message: "ok",
            data: character,
            copy: bottomMessageHTML,
        });
    } catch (err: any) {
        return res.status(500).send({
            message: err.toString(),
        });
    }
});

app.get("/comics/:id", async (req: Request, res: Response) => {
    try {
        const page: number = req.query.page ? Number(req.query.page as string) : 1;

        console.log("page:");
        console.log(page);

        const limit: number = 10;
        const offset = limit * (page - 1);

        console.log("offset:");
        console.log(offset);

        const id = req.params.id;
        const apiResponse = await apiMarvel.get(`/characters/${id}/comics`, {
            params: {
                ...createAuth(),
                limit,
                offset,
            },
        });
        console.log(spyApi(req, id));

        let comicsList = apiResponse.data.data.results;

        let bottomMessageHTML = `
    <a href=\"http://marvel.com\" class='text-center'>${apiResponse.data.attributionText}</a>`;

        return res.status(200).send({
            message: "ok",
            data: comicsList,
            copy: bottomMessageHTML,
        });
    } catch (err: any) {
        return res.status(500).send({
            message: err.toString(),
        });
    }
});

app.listen(process.env.PORT || 8081, () => console.log("Server is running..."));
