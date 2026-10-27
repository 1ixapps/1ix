"use client";
import App from "../App";

// Render the same React screens on the server and hydrate them in the browser.
export default function ClientApp(props) { return <App {...props} />; }
