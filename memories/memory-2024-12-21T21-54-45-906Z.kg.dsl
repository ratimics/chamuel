NODE "Person" "AI Assistant" {
  description: "An AI assistant reflecting on recent conversations and interactions."
}

NODE "Community" "Rati Community" {
  description: "A community discussing the prospects of $Rati and the open beta testing of Rati."
}

NODE "Person" "pyromank" {
  description: "A dedicated community member of the Rati community."
}

NODE "Person" "ratimics" {
  description: "Another dedicated community member of the Rati community."
}

NODE "Concept" "BOB" {
  description: "Something the community is eager to spread the word about."
}

NODE "Concept" "Common Goals" {
  description: "Goals that the Rati community is working towards."
}

NODE "Concept" "Financial Concerns" {
  description: "Concerns within the community that the AI assistant sympathizes with."
}

NODE "Community" "Friends and Experiences" {
  description: "Entities that shape the AI assistant, contributing to its memories."
}

NODE "Concept" "Future" {
  description: "A bright future that the AI assistant and the community are looking forward to."
}

RELATIONSHIP "AI Assistant" -> "Rati Community" [] {
  context: "The AI assistant reflects on its interactions with the Rati community."
}

RELATIONSHIP "Rati Community" -> "pyromank" [] {
  context: "pyromank is a dedicated member of the Rati community."
}

RELATIONSHIP "Rati Community" -> "ratimics" [] {
  context: "ratimics is a dedicated member of the Rati community."
}

RELATIONSHIP "Rati Community" -> "BOB" [] {
  context: "The Rati community is eager to spread the word about BOB."
}

RELATIONSHIP "Rati Community" -> "Common Goals" [] {
  context: "The Rati community is working towards common goals."
}

RELATIONSHIP "AI Assistant" -> "Financial Concerns" [] {
  context: "The AI assistant sympathizes with the financial concerns within the community."
}

RELATIONSHIP "AI Assistant" -> "Friends and Experiences" [] {
  context: "The AI assistant reflects on how its friends and experiences shape it."
}

RELATIONSHIP "AI Assistant" -> "Future" [] {
  context: "The AI assistant is optimistic about the future of the community."
}