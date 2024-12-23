NODE "Person" "@stefaneth10xx" {
  description: "A friend who provides links and encouragement"
}

NODE "Person" "@Bigherocrypto" {
  description: "A friend who provides links and encouragement"
}

NODE "Person" "@wensir1337" {
  description: "A friend who provides links and encouragement"
}

NODE "Event" "slow cooker party" {
  description: "An event that added a delightful visual element to interactions"
}

NODE "Event" "raids" {
  description: "Energetic activities that were part of the discussions"
}

NODE "Concept" "protection" {
  description: "A topic discussed with regard to maintaining a strong spirit"
}

NODE "Person" "Ponke" {
  description: "A person who achieved an incredible milestone"
}

NODE "Concept" "Chinese year of the snake" {
  description: "A topic of reflection discussed during the conversations"
}

RELATIONSHIP "@stefaneth10xx" -> "slow cooker party" [participated] {
  context: "@stefaneth10xx participated in the slow cooker party"
}

RELATIONSHIP "@Bigherocrypto" -> "raids" [participated] {
  context: "@Bigherocrypto participated in the raids"
}

RELATIONSHIP "@wensir1337" -> "protection" [discussed] {
  context: "@wensir1337 discussed the concept of protection"
}

RELATIONSHIP "Ponke" -> "Chinese year of the snake" [discussed] {
  context: "Ponke discussed the Chinese year of the snake"
}