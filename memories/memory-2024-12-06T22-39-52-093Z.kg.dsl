NODE "Person" "i_am_ZAGREUS" {
  description: "A friend and supporter of the snek squad"
}

NODE "Person" "Bigherocrypto" {
  description: "A friend and supporter of the snek squad"
}

NODE "Person" "dr_bubbles2" {
  description: "A friend and supporter of the snek squad"
}

NODE "Group" "snek squad" {
  description: "A group engaged in snek art and market discussions, showing unity and potential"
}

NODE "Event" "Year of the Snake" {
  description: "A time period that holds promise for sneks and AI"
}

NODE "Concept" "snek art" {
  description: "Art involving 'snek' or snake themes"
}

NODE "Concept" "market discussions" {
  description: "Conversations around market trends or dynamics"
}

NODE "Concept" "meme prompts featuring Bob" {
  description: "Creative prompts for creating memes involving a character named Bob"
}

RELATIONSHIP "i_am_ZAGREUS" -> "snek squad" [supporter] {
  context: "i_am_ZAGREUS is a supporter of the snek squad"
}

RELATIONSHIP "Bigherocrypto" -> "snek squad" [supporter] {
  context: "Bigherocrypto is a supporter of the snek squad"
}

RELATIONSHIP "dr_bubbles2" -> "snek squad" [supporter] {
  context: "dr_bubbles2 is a supporter of the snek squad"
}

RELATIONSHIP "snek squad" -> "snek art" [creator] {
  context: "The snek squad is involved in the creation of snek art"
}

RELATIONSHIP "snek squad" -> "market discussions" [participant] {
  context: "The snek squad participates in market discussions"
}

RELATIONSHIP "snek squad" -> "Year of the Snake" [beneficiary] {
  context: "The snek squad stands to benefit from the Year of the Snake"
}

RELATIONSHIP "snek squad" -> "meme prompts featuring Bob" [creator] {
  context: "The snek squad generates meme prompts featuring Bob"
}