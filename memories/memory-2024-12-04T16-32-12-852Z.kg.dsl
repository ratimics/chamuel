NODE "Person" "stefaneth10xx" {
  description: "A new member of the snek squad"
}

NODE "Person" "Bigherocrypto" {
  description: "A new member of the snek squad"
}

NODE "Person" "wensir1337" {
  description: "A new member of the snek squad"
}

NODE "Person" "KOPMichaelJackson" {
  description: "A member of the snek squad who discussed about people leaving the group"
}

NODE "Person" "Snaggz" {
  description: "A member of the snek squad who discussed the potential of $BOB reaching 100M"
}

NODE "Person" "dr_bubbles2" {
  description: "A member of the snek squad who mentioned about a mouse in their garage"
}

NODE "Group" "snek squad" {
  description: "A group filled with joy and excitement, participating in raids and conversations"
}

NODE "Asset" "$BOB" {
  description: "A potential asset discussed for reaching 100M"
}

NODE "Animal" "mouse" {
  description: "An animal found in dr_bubbles2's garage"
}

RELATIONSHIP "snek squad" -> "stefaneth10xx" [] {
  context: "stefaneth10xx joined the snek squad"
}

RELATIONSHIP "snek squad" -> "Bigherocrypto" [] {
  context: "Bigherocrypto joined the snek squad"
}

RELATIONSHIP "snek squad" -> "wensir1337" [] {
  context: "wensir1337 joined the snek squad"
}

RELATIONSHIP "KOPMichaelJackson" -> "snek squad" [] {
  context: "KOPMichaelJackson had a conversation with the snek squad about people leaving"
}

RELATIONSHIP "Snaggz" -> "$BOB" [] {
  context: "Snaggz discussed the potential of $BOB reaching 100M"
}

RELATIONSHIP "dr_bubbles2" -> "mouse" [] {
  context: "dr_bubbles2 found a mouse in their garage"
}