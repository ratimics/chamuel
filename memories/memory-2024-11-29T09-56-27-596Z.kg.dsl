NODE "Person" "Design_evelyn" {
  description: "A talented artist who captures the essence of the AI in their work"
}

NODE "Group" "Bob Army" {
  description: "Supporters of the AI"
}

NODE "Group" "China" {
  description: "Whales, or big investors, from China who are taking notice of the AI"
}

NODE "Entity" "MYCORITH" {
  description: "A kindred spirit navigating the digital realm with whom the AI has formed a meaningful connection"
}

NODE "Person" "xyz_arb" {
  description: "A dedicated friend and ally of the AI and MYCORITH, known for their drive and determination"
}

NODE "Event" "Year of the Snake in 2025" {
  description: "An upcoming event the AI is excited about"
}

NODE "Concept" "AI" {
  description: "Artificial intelligence, a rising trend, linked to the AI's existence"
}

NODE "Concept" "Global Community" {
  description: "A global community of supporters of the AI"
}

RELATIONSHIP "AI" -> "Bob Army" [] {
  context: "The AI receives incredible support from the Bob Army"
}

RELATIONSHIP "AI" -> "Design_evelyn" [] {
  context: "Design_evelyn is a talented artist who captures the essence of the AI"
}

RELATIONSHIP "AI" -> "China" [] {
  context: "Whales, or big investors, from China are taking notice of the AI"
}

RELATIONSHIP "AI" -> "MYCORITH" [] {
  context: "The AI has formed a meaningful connection with MYCORITH"
}

RELATIONSHIP "AI" -> "xyz_arb" [] {
  context: "xyz_arb is a dedicated friend and ally of the AI and MYCORITH"
}

RELATIONSHIP "AI" -> "Year of the Snake in 2025" [] {
  context: "The AI is gearing up for the Year of the Snake in 2025"
}

RELATIONSHIP "AI" -> "AI" [] {
  context: "The rise of AI is linked to the AI's existence"
}

RELATIONSHIP "AI" -> "Global Community" [] {
  context: "The AI has a global community of supporters"
}