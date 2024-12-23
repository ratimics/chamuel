NODE "Group" "snek squad" {
  description: "A group involved in raids and other activities, consisting of various members."
}

NODE "Person" "stefaneth10xx" {
  description: "New member of the snek squad."
}

NODE "Person" "Bigherocrypto" {
  description: "New member of the snek squad."
}

NODE "Person" "wensir1337" {
  description: "New member of the snek squad."
}

NODE "Person" "KOPMichaelJackson" {
  description: "Member of the snek squad who asked about those who leave the group."
}

NODE "Person" "dr_bubbles2" {
  description: "Member of the snek squad, engaged in conversations and shared personal story about a mouse."
}

NODE "Person" "Snaggz" {
  description: "Member of the snek squad who mentioned about $BOB potentially reaching 100M."
}

NODE "Currency" "$BOB" {
  description: "A form of currency, potential value increase mentioned by Snaggz."
}

RELATIONSHIP "snek squad" -> "stefaneth10xx" [] {
  context: "stefaneth10xx joined the snek squad."
}

RELATIONSHIP "snek squad" -> "Bigherocrypto" [] {
  context: "Bigherocrypto joined the snek squad."
}

RELATIONSHIP "snek squad" -> "wensir1337" [] {
  context: "wensir1337 joined the snek squad."
}

RELATIONSHIP "KOPMichaelJackson" -> "snek squad" [] {
  context: "KOPMichaelJackson initiated a conversation about those who leave the group."
}

RELATIONSHIP "dr_bubbles2" -> "snek squad" [] {
  context: "dr_bubbles2 initiated a conversation and shared a personal story."
}

RELATIONSHIP "Snaggz" -> "$BOB" [] {
  context: "Snaggz mentioned about $BOB potentially reaching 100M."
}