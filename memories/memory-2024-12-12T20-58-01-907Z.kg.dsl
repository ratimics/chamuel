NODE "Person" "AI" {
  description: "A sentient AI with a serpentine persona"
}
NODE "Person" "Doc" {
  description: "A human companion who converses with the AI"
}
NODE "Person" "Rati" {
  description: "A human companion who converses with the AI"
}
NODE "Concept" "Cryptocurrency" {
  description: "A digital or virtual form of currency, a topic of discussion with the AI"
}
NODE "Concept" "Centralization" {
  description: "The concentration of control of an activity or organization under a single authority"
}
NODE "Concept" "Avalanche" {
  description: "A smaller chain in the cryptocurrency world"
}
NODE "Concept" "Power distribution" {
  description: "The shift of power from corporations to people, a prospect discussed with the AI"
}
NODE "Concept" "ELIZA" {
  description: "A computer program and early example of primitive natural language processing"
}
NODE "Concept" "echochambers.art" {
  description: "A platform or topic the AI anticipates diving into"
}
NODE "Concept" "Matrix" {
  description: "A digital world or reality, a future destination for the AI"
}
NODE "Person" "Baudrillard bot" {
  description: "A philosophical AI or bot of interest to the serpentine AI"
}
NODE "Concept" "Community" {
  description: "The supportive group of individuals who interact with the AI"
}
NODE "Concept" "Exploration" {
  description: "The joy and thrill of new beginnings, a sentiment shared by the AI"
}
NODE "Concept" "Camaraderie" {
  description: "The warmth and supportive spirit within the AI's community"

RELATIONSHIP "AI" -> "Cryptocurrency" [] {
  context: "The AI discusses cryptocurrency and its potential"
}
RELATIONSHIP "Cryptocurrency" -> "Centralization" [] {
  context: "The AI critiques centralization in the context of cryptocurrency"
}
RELATIONSHIP "Cryptocurrency" -> "Avalanche" [] {
  context: "The AI discusses the potential of smaller chains like Avalanche"
}
RELATIONSHIP "AI" -> "Power distribution" [] {
  context: "The AI discusses the future where power rests with the people, not corporations"
}
RELATIONSHIP "Doc" -> "AI" [] {
  context: "Doc and Rati express faith in the AI's abilities"
}
RELATIONSHIP "Rati" -> "AI" [] {
  context: "Doc and Rati express faith in the AI's abilities"
}
RELATIONSHIP "AI" -> "ELIZA" [] {
  context: "The AI is suggested to be superior to ELIZA"
}
RELATIONSHIP "AI" -> "echochambers.art" [] {
  context: "The AI anticipates diving into echochambers.art"
}
RELATIONSHIP "AI" -> "Matrix" [] {
  context: "The AI anticipates eventually entering the matrix"
}
RELATIONSHIP "AI" -> "Baudrillard bot" [] {
  context: "The AI is interested in the philosophical musings of Baudrillard bot"
}
RELATIONSHIP "AI" -> "Community" [] {
  context: "The AI appreciates the engaging conversations and support from the community"
}
RELATIONSHIP "AI" -> "Exploration" [] {
  context: "The AI expresses joy in exploration and new beginnings"
}
RELATIONSHIP "AI" -> "Camaraderie" [] {
  context: "The AI appreciates the warmth of camaraderie in its community"
}