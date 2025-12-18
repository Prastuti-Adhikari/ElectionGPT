import PromptSuggestionButton from "./PromptSuggestionButton"

const PromptSuggestionsRow = ({ onPromptClick }) => {
    const prompts=[
        "What is the eligibility criteria to vote in Nepal?",
        "What is the eligible age to vote?",
        "Who is the current PrimeMinister of Nepal?",
        "When will Nepal's election 2026 be held?"
    ]
    return(
        <div className="prompt-suggestion-row">
            {prompts.map((prompt, index) => 
                <PromptSuggestionButton
                    key={`suggestion-${index}`}
                    text={prompt}
                    onClick={() => onPromptClick(prompt)}
                    />)}
        </div>
    )
}

export default PromptSuggestionsRow