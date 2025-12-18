"use client"
import Image from "next/image"
import electionGPTLogo from "./assets/electionGPTLogo.png"
import { useChat } from "ai/react"
import type { Message } from "ai"
import Bubble from "./components/Bubble"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggestionsRow from "./components/PromptSuggestionsRow"


const Home = () => {
    const {append, isLoading, messages, input, handleInputChange, handleSubmit} = useChat()
    const noMessages = false
    const handlePrompt = ( promptText ) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user"
        }
        append(msg)
    }
    return(
        <main> 
            <Image 
                src={electionGPTLogo}
                width={250}
                alt="ElectionGPTLogo"
            />
            <section className={noMessages?"":"populated"}>
                {noMessages ? (
                    <>
                        <p className="Starter-text">
                            If you have any queries or confusions regarding Nepal's Election then this platform is totally for YOUUUU.
                        </p>
                        <br/>
                        <PromptSuggestionsRow onPromptClick={handlePrompt}/>
                    </>  
                ): (
                    <>
                    {messages.map((message, index) => <Bubble key={`message-${index}`} message={message}/>)}
                    {isLoading && <LoadingBubble/>}
                    </>
                )}
            </section>
            <form onSubmit={handleSubmit}>
                <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me something!"/>
                <input type="submit"/>
            </form>
        </main>
    )
}

export default Home
