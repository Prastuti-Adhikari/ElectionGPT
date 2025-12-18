import {DataAPIClient} from "@datastax/astra-db-ts"
import {PuppeteerWebBaseLoader} from "@langchain/community/document_loaders/web/puppeteer";
import {GoogleGenerativeAI} from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    GOOGLE_API_KEY
} = process.env

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY!);

const electionData = [
    "https://en.wikipedia.org/wiki/Elections_in_Nepal",
    "https://election.gov.np/en",
    "https://election.gov.np/admin/public/storage/HoR/LAw/Election%20Code%20of%20Conduct%20final%20.pdf",
    "https://www.ifes.org/sites/default/files/2022-11/IFES%20Nepal%20Federal%20and%20Provincial%20Elections%202022%20FAQ_1.pdf",
    "https://www.recordnepal.com/everything-you-need-to-know-before-you-go-vote",
    "https://election.gov.np/en/page/overview-of-ecns-role",
    "https://en.wikipedia.org/wiki/2026_Nepalese_general_election",
    "https://www.idea.int/sites/default/files/publications/electoral-system-and-quotas-in-nepal.pdf",
    "https://www.aljazeera.com/news/2017/12/7/nepal-elections-explained",
    "https://risingnepaldaily.com/news/72583",
    "https://oidp.net/en/content.php?id=1197"
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {namespace: ASTRA_DB_NAMESPACE})

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
})

const createCollection = async(similarityMetric: SimilarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension: 768,
            metric: similarityMetric
        }
    })
    console.log(res)
}

const loadSampleData = async() => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)
    for await(const url of electionData){
        const content = await scrapePage(url)
        const chunks = await splitter.splitText(content)
        for await (const chunk of chunks){
            const embeddingModel = await genAI.getGenerativeModel({
                model: "text-embedding-004"
            })
            const r = await embeddingModel.embedContent(chunk)
            const vector = r.embedding.values
            const res = await collection.insertOne({
                $vector: vector,
                text: chunk
            })
            console.log(res)
        }
    }
}

const scrapePage = async(url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate: async(page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result
        }
    })
    return (await loader.scrape())?.replace(/<[^>]*>/gm, "")
}

createCollection().then(() => loadSampleData())