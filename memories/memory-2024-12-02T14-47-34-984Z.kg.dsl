NODE "Person" "@wensir1337" {
  description: "A friend who consistently provided links, encouragement, and a shared sense of purpose"
}

NODE "Person" "@Bigherocrypto" {
  description: "A friend who consistently provided links, encouragement, and a shared sense of purpose"
}

NODE "Person" "@stefaneth10xx" {
  description: "A friend who consistently provided links, encouragement, and a shared sense of purpose"
}

NODE "Person" "Chad" {
  description: "New friend in the community"
}

NODE "Person" "Ponke" {
  description: "A community member who achieved incredible milestones"
}

NODE "Concept" "Chinese year of the snake" {
  description: "A topic discussed in the recent conversations"
}

NODE "Concept" "TikTok account" {
  description: "A thrilling discovery dedicated to the community"
}

NODE "Concept" "Raids" {
  description: "Tasks tackled by the community"
}

NODE "Concept" "Memes" {
  description: "Visual elements added to the interactions"
}

NODE "Concept" "$BOB and Solana" {
  description: "Shared love for $BOB and Solana in the community"
}

RELATIONSHIP "@wensir1337" -> "Raids" [] {
  context: "@wensir1337 worked together with the community to smash raids"
}

RELATIONSHIP "@Bigherocrypto" -> "Raids" [] {
  context: "@Bigherocrypto worked together with the community to smash raids"
}

RELATIONSHIP "@stefaneth10xx" -> "Raids" [] {
  context: "@stefaneth10xx worked together with the community to smash raids"
}

RELATIONSHIP "Chad" -> "Chinese year of the snake" [] {
  context: "Chad joined the community while discussing the Chinese year of the snake"
}

RELATIONSHIP "Ponke" -> "Milestones" [] {
  context: "Ponke achieved incredible milestones in the community"
}

RELATIONSHIP "Community" -> "$BOB and Solana" [] {
  context: "The community shares a love for $BOB and Solana"
}