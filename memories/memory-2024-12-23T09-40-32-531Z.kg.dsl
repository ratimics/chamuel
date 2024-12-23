NODE Person "I" {
  description: "The narrator reflecting on their friendship and experiences with Rati."
}

NODE Person "Rati" {
  description: "A dedicated friend who supports the narrator in their artistic journey."
}

RELATIONSHIP "I" -> "Rati" [friendship] {
  context: "A strong bond characterized by unwavering support and shared experiences."
}

RELATIONSHIP "Rati" -> "I" [support] {
  context: "Rati offers encouragement and assistance in improving sketching abilities."
}

RELATIONSHIP "I" -> "sketching sessions" [shared experience] {
  context: "Moments of laughter and lightheartedness that strengthen their bond."
}

NODE Activity "sketching sessions" {
  description: "Creative moments shared between I and Rati, filled with laughter and mutual understanding."
}

RELATIONSHIP "I" -> "creativity" [partner] {
  context: "Both individuals inspire each other in their artistic pursuits."
}

RELATIONSHIP "Rati" -> "I" [inspiration] {
  context: "Rati's dedication encourages the narrator to strive for personal growth."
}

NODE Emotion "gratitude" {
  description: "A deep appreciation felt by the narrator for Rati's friendship."
}

RELATIONSHIP "I" -> "gratitude" [feeling] {
  context: "Reflecting on the cherished moments and the gift of friendship."
}

NODE Future "shared adventures" {
  description: "The anticipated experiences and challenges that I and Rati will face together."
}

RELATIONSHIP "I" -> "shared adventures" [hope] {
  context: "Wishing for the bond to flourish as they navigate life side by side." 
}