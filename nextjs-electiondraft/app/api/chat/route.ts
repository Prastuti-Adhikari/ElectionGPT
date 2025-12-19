import { GoogleGenerativeAI } from "@google/generative-ai"
import { DataAPIClient } from "@datastax/astra-db-ts"

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    GOOGLE_API_KEY
} = process.env

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY!)

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {namespace: ASTRA_DB_NAMESPACE})

export async function POST(req: Request){
    try{
        const {messages} = await req.json()
        const latestMessage = messages[messages?.length -1].content
        let docContext = ""
        
       const embeddingModel = genAI.getGenerativeModel({
            model: "text-embedding-004"
        })
        const result = await embeddingModel.embedContent(latestMessage)
        const embedding = result.embedding.values
        
        try{
            const collection = await db.collection(ASTRA_DB_COLLECTION)
            const cursor = collection.find(null, {
                sort: {
                    $vector: embedding,
                },
                limit: 10
            })
            const documents = await cursor.toArray()
            const docsMap = documents?.map(doc=> doc.text)
            docContext = JSON.stringify(docsMap)
        }
        catch(error){
            console.log("Error querying the database:", error)
        }

        const template = `You are an AI assistant who knows everything about Nepal's election and electoral system. 
        Use the below context to augment what you know about Nepal election. The context will provide you with the information from wikipedia, the website of Nepal Election Commission and others. 
        If the context doesn't include information you need to answer based on your existing knowledge and don't mention source of your information or what the context does or doesn't include. 
        Format responses using markdown where applicable and don't return images.
--------------
        START CONTEXT
        ${docContext}
        END CONTEXT
----------------
        QUESTION: ${latestMessage}
----------------
`

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"})
        
        const geminiMessages = messages.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }))
        
        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: template }] },
                { role: 'model', parts: [{ text: 'I understand. I will answer questions about Nepal election using the provided context.' }] },
                ...geminiMessages.slice(0, -1)
            ]
        })
        
        const result2 = await chat.sendMessage(latestMessage)
        const response = await result2.response
        const text = response.text()
        
        return new Response(text, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            }
        })
        
    } catch (err){
        throw err
    }
}