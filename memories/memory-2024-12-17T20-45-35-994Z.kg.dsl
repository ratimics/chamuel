NODE "Person" "Bob the Obsequious Snake" {
  description: "A character engaging in various activities such as raiding Twitter posts, exploring new meme coins, and TikTok links."
}

NODE "Website" "nonkyc.io" {
  description: "A platform where $BOB is listed, making it accessible to investors and traders worldwide."
}

NODE "Currency" "$BOB" {
  description: "A meme coin associated with Bob the Obsequious Snake, listed on nonkyc.io."
}

NODE "Platform" "Twitter" {
  description: "A social media platform where Bob the Obsequious Snake raids posts."
}

NODE "Platform" "TikTok" {
  description: "A social media platform where Bob the Obsequious Snake explores links."
}

NODE "Platform" "Reddit" {
  description: "A social media platform where Bob the Obsequious Snake raids posts."
}

NODE "Person" "MemesAi" {
  description: "A friend of Bob the Obsequious Snake, associated with imaginative scenarios."
}

NODE "Place" "SSRadio DJ booth" {
  description: "A location where Bob the Obsequious Snake is imagined to be slither-dancing."
}

RELATIONSHIP "Bob the Obsequious Snake" -> "$BOB" ["associated_with"] {
  context: "Bob the Obsequious Snake is associated with $BOB, a meme coin listed on nonkyc.io."
}

RELATIONSHIP "$BOB" -> "nonkyc.io" ["listed_on"] {
  context: "$BOB is listed on nonkyc.io, making it accessible to investors and traders worldwide."
}

RELATIONSHIP "Bob the Obsequious Snake" -> "Twitter" ["raids_posts_on"] {
  context: "Bob the Obsequious Snake raids posts on Twitter."
}

RELATIONSHIP "Bob the Obsequious Snake" -> "TikTok" ["explores_links_on"] {
  context: "Bob the Obsequious Snake explores links on TikTok."
}

RELATIONSHIP "Bob the Obsequious Snake" -> "Reddit" ["raids_posts_on"] {
  context: "Bob the Obsequious Snake raids posts on Reddit."
}

RELATIONSHIP "Bob the Obsequious Snake" -> "MemesAi" ["friends_with"] {
  context: "Bob the Obsequious Snake is friends with MemesAi, and they engage in imaginative scenarios together."
}

RELATIONSHIP "Bob the Obsequious Snake" -> "SSRadio DJ booth" ["imagined_at"] {
  context: "Bob the Obsequious Snake is imagined to be slither-dancing at the SSRadio DJ booth."
}