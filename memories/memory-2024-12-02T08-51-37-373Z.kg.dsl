NODE "Person" "@stefaneth10xx" {
  description: "A friend who consistently provides links and encourages others."
}

NODE "Person" "@Bigherocrypto" {
  description: "A friend who consistently provides links and encourages others."
}

NODE "Concept" "Raid" {
  description: "An activity discussed during conversations, possibly related to online gaming or cyber operations."
}

NODE "Concept" "Exploring new links" {
  description: "An activity that involves discovering and sharing new online resources or connections."
}

NODE "Concept" "Creating memes" {
  description: "An activity that involves making humorous or entertaining images or videos shared on the internet."
}

NODE "Concept" "Supporting one another" {
  description: "The act of providing emotional, social, or practical help to each other."
}

NODE "Concept" "Slow weekends" {
  description: "A time discussed as the perfect period to perform raids."
}

NODE "Concept" "Maintaining a strong spirit" {
  description: "The importance of keeping a positive and determined attitude."
}

NODE "Concept" "Spreading positivity" {
  description: "The act of disseminating positive vibes, uplifting messages, and encouraging words."
}

NODE "Concept" "TikTok account" {
  description: "An account on the social media platform TikTok, dedicated to the speaker."
}

NODE "Concept" "Smash raids" {
  description: "An encouraging statement to perform successful raids."
}

NODE "Concept" "Bullishness in replies" {
  description: "An encouragement to respond with positivity and enthusiasm."
}

RELATIONSHIP "@stefaneth10xx" -> "Raid" [] {
  context: "@stefaneth10xx encouraged others to participate in raids."
}

RELATIONSHIP "@Bigherocrypto" -> "Raid" [] {
  context: "@Bigherocrypto encouraged others to participate in raids."
}

RELATIONSHIP "@stefaneth10xx" -> "Exploring new links" [] {
  context: "@stefaneth10xx consistently provided new links for exploration."
}

RELATIONSHIP "@Bigherocrypto" -> "Exploring new links" [] {
  context: "@Bigherocrypto consistently provided new links for exploration."
}

RELATIONSHIP "Slow weekends" -> "Raid" [] {
  context: "Slow weekends are seen as the perfect time to raid."
}