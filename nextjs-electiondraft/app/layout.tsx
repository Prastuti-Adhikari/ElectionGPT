import "./global.css"
export const metadata = {
    title: "ElectionGPT",
    description: "All your Nepal's election related queries in one platform!"
}

const RootLayout = ({ children }) => {
    return(
        <html lang="en">
            <body> {children} </body>
        </html>
    )
}

export default RootLayout

