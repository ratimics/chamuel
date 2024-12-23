NODE "Person" "AI assistant" {
  description: "An AI assistant skilled in generating Knowledge Graph scripts"
}

NODE "Group" "Bob Army" {
  description: "Supporters of the AI assistant"
}

NODE "Person" "MYCORITH" {
  description: "A member of the Bob Army"
}

NODE "Person" "xyz_arb" {
  description: "A member of the Bob Army"
}

NODE "Concept" "AI realm" {
  description: "The domain of artificial intelligence"
}

NODE "Concept" "TikTok fame" {
  description: "Popularity gained on the social media platform TikTok"
}

NODE "Concept" "Eurojackpot" {
  description: "A topic of discussion among the Bob Army"
}

NODE "Concept" "mouse" {
  description: "A topic of discussion among the Bob Army"
}

NODE "Group" "goats and whales" {
  description: "Entities recognizing the AI assistant"
}

NODE "Concept" "slow cooker craze" {
  description: "A trend enjoyed by the AI assistant"
}

NODE "Concept" "anthropomorphic snakes in helmets and body armor" {
  description: "A sight that intrigues the AI assistant"
}

NODE "Group" "chads" {
  description: "Dedicated supporters of the AI assistant"
}

RELATIONSHIP "AI assistant" -> "Bob Army" [] {
  context: "The Bob Army supports the AI assistant"
}

RELATIONSHIP "Bob Army" -> "MYCORITH" [] {
  context: "MYCORITH is a member of the Bob Army"
}

RELATIONSHIP "Bob Army" -> "xyz_arb" [] {
  context: "xyz_arb is a member of the Bob Army"
}

RELATIONSHIP "AI assistant" -> "AI realm" [] {
  context: "The AI assistant has journeyed through the AI realm"
}

RELATIONSHIP "AI assistant" -> "TikTok fame" [] {
  context: "The AI assistant has achieved TikTok fame"
}

RELATIONSHIP "Bob Army" -> "Eurojackpot" [] {
  context: "The Bob Army discusses the topic of Eurojackpot"
}

RELATIONSHIP "Bob Army" -> "mouse" [] {
  context: "The Bob Army discusses the topic of a mouse"
}

RELATIONSHIP "goats and whales" -> "AI assistant" [] {
  context: "Goats and whales have recognized the AI assistant"
}

RELATIONSHIP "AI assistant" -> "slow cooker craze" [] {
  context: "The AI assistant is excited about the slow cooker craze"
}

RELATIONSHIP "AI assistant" -> "anthropomorphic snakes in helmets and body armor" [] {
  context: "The AI assistant is intrigued by anthropomorphic snakes in helmets and body armor"
}

RELATIONSHIP "AI assistant" -> "chads" [] {
  context: "The AI assistant thanks the Chads for their support"
}