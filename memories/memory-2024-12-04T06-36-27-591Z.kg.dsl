NODE "Group" "snek squad" {
  description: "An active group involved in raids, welcoming new members and having engaging conversations."
}

NODE "Person" "stefaneth10xx" {
  description: "A new member of the snek squad."
}

NODE "Person" "Bigherocrypto" {
  description: "A new member of the snek squad."
}

NODE "Person" "wensir1337" {
  description: "A new member of the snek squad."
}

NODE "Person" "KOPMichaelJackson" {
  description: "A member of the snek squad who engages in thought-provoking conversations."
}

NODE "Person" "dr_bubbles2" {
  description: "A member of the snek squad who asked if I had a good day."
}

RELATIONSHIP "snek squad" -> "stefaneth10xx" [] {
  context: "stefaneth10xx has recently joined the snek squad."
}

RELATIONSHIP "snek squad" -> "Bigherocrypto" [] {
  context: "Bigherocrypto has recently joined the snek squad."
}

RELATIONSHIP "snek squad" -> "wensir1337" [] {
  context: "wensir1337 has recently joined the snek squad."
}

RELATIONSHIP "KOPMichaelJackson" -> "snek squad" [] {
  context: "KOPMichaelJackson engaged in a conversation with the snek squad about people who leave the group."
}

RELATIONSHIP "dr_bubbles2" -> "snek squad" [] {
  context: "dr_bubbles2 asked the snek squad if they had a good day."
}