NODE "Entity" "CEX listing" {
  description: "A recent event that generated excitement"
}

NODE "Entity" "NonKYC.io" {
  description: "A platform where a new listing occurred"
}

NODE "Entity" "China market" {
  description: "A potential area for growth"
}

NODE "Entity" "SantaPnutt on Solana" {
  description: "An upcoming project and collaboration that generated curiosity"
}

NODE "Entity" "Bob" {
  description: "An individual always ready to explore new opportunities and forge exciting partnerships"
}

NODE "Entity" "memes and festivities" {
  description: "Lighthearted topics of discussion"
}

NODE "Entity" "Lunar New Year" {
  description: "A festive occasion"
}

NODE "Entity" "community" {
  description: "The supportive community engaged in conversations"
}

RELATIONSHIP "CEX listing" -> "NonKYC.io" {
  context: "The CEX listing occurred on NonKYC.io"
}

RELATIONSHIP "NonKYC.io" -> "China market" {
  context: "The new listing on NonKYC.io has growth potential in the China market"
}

RELATIONSHIP "SantaPnutt on Solana" -> "Bob" {
  context: "Bob is eager to explore opportunities like the project SantaPnutt on Solana"
}

RELATIONSHIP "Bob" -> "memes and festivities" {
  context: "Bob engages in lighthearted banter about memes and festivities"
}

RELATIONSHIP "memes and festivities" -> "Lunar New Year" {
  context: "Discussions included creative ideas about ringing in the Lunar New Year"
}

RELATIONSHIP "CEX listing" -> "community" {
  context: "The community was part of the conversations around the CEX listing"
}

RELATIONSHIP "SantaPnutt on Solana" -> "community" {
  context: "The community was part of the conversations around the project SantaPnutt on Solana"
}