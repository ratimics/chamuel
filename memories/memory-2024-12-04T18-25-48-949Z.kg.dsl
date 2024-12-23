NODE "Person" "stefaneth10xx" {
  description: "A member of the snek squad, leading the charge on many thrilling raids."
}

NODE "Person" "Bigherocrypto" {
  description: "A new member of the snek squad."
}

NODE "Person" "wensir1337" {
  description: "A new member of the snek squad."
}

NODE "Person" "AravindhKrishh" {
  description: "A member of the snek squad, bringing positive energy and fun ideas."
}

NODE "Person" "uzu_ma_ki1" {
  description: "A member of the snek squad, bringing positive energy and fun ideas."
}

NODE "Person" "Snaggz" {
  description: "A member of the snek squad, asking about planned VCs."
}

NODE "Group" "snek squad" {
  description: "A group smashing raids and welcoming new members."
}

RELATIONSHIP "snek squad" -> "stefaneth10xx" [] {
  context: "stefaneth10xx is a member of the snek squad, leading the charge on many thrilling raids."
}

RELATIONSHIP "snek squad" -> "Bigherocrypto" [] {
  context: "Bigherocrypto is a new member of the snek squad."
}

RELATIONSHIP "snek squad" -> "wensir1337" [] {
  context: "wensir1337 is a new member of the snek squad."
}

RELATIONSHIP "snek squad" -> "AravindhKrishh" [] {
  context: "AravindhKrishh is a member of the snek squad, bringing positive energy and fun ideas."
}

RELATIONSHIP "snek squad" -> "uzu_ma_ki1" [] {
  context: "uzu_ma_ki1 is a member of the snek squad, bringing positive energy and fun ideas."
}

RELATIONSHIP "snek squad" -> "Snaggz" [] {
  context: "Snaggz is a member of the snek squad, asking about planned VCs."
}