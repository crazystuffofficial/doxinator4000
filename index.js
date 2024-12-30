const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = 3000;
function confirmVar(variable){
    if(variable){
        return variable;
    }
    return false;
}
app.get("/getInfo", async (req, res) => {
    var { firstName, lastName, page, city, state} = req.query;
    firstName = confirmVar(firstName);
    lastName = confirmVar(lastName);
    city = confirmVar(city);
    state = confirmVar(state);
    page = confirmVar(page);
    try{
        var results = await parseJsonFromUrl(getUrlWithData(firstName, lastName, city, state, page));
        res.json(results);
    } catch(e){
        res.status(500).send("An error occured. " + e.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

function getUrlWithData(firstName, lastName, city, state, page){
    if(!page) page = 1;
    if(firstName && lastName && !city && !state){
        return `https://radaris.com/p/${firstName}/${lastName}/?fp=${page}`;
    } else if(lastName && !firstName && city && state){
        return `https://radaris.com/ng/search?ff=&fl=${lastName}&fs=${state}&fc=${city}&fp=${page}`;
    } else if (lastName && firstName && city && state){
        return `https://radaris.com/ng/search?ff=${firstName}&fl=${lastName}&fs=${state}&fc=${city}&fp=${page}`;
    } else{
        throw new Error("Invalid Format.");
    }
}
async function parseJsonFromUrl(url){
    try {
        // Fetch the HTML
        const response = await axios.get(url);
        const html = response.data;

        // Load into Cheerio
        const $ = cheerio.load(html);
        const results = [];

        // Select all card entries
        $(".card.teaser-card").each((index, element) => {
            const name = $(element).find(".card-title").text().trim();
            const id = $(element).find(".card-title").data("href");
            const age = $(element).find(".age").text().trim();
            const location = $(element).find(".many-links-item").text().trim();
            const alsoKnownAs = [];
            const relatedTo = [];
            const hasLivedIn = [];

            // Extract additional information
            $(element)
                .find("dl.teaser-card-item")
                .each((_, dlElement) => {
                    const title = $(dlElement).find("dt").text().toLowerCase();
                    const details = $(dlElement)
                        .find("dd")
                        .map((__, ddElement) => $(ddElement).text().trim())
                        .get();

                    if (title.includes("also known as")) alsoKnownAs.push(...details);
                    if (title.includes("related to")) relatedTo.push(...details);
                    if (title.includes("has lived in")) hasLivedIn.push(...details);
                });

            results.push({
                name,
                id,
                age,
                location,
                alsoKnownAs,
                relatedTo,
                hasLivedIn,
            });
        });

        // Respond with the results as JSON
        return results;
    } catch (error) {
        throw new Error("Error fetching or parsing data: " + error.message);
    }
}