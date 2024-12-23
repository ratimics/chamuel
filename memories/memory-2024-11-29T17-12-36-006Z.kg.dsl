NODE "Community" "Bob Army" {
  description: "A community engaged in activities like raids, shilling to groups, and celebrating the return of AI plays."
}

NODE "Person" "Bigherocrypto" {
  description: "A member of the Bob Army community who provides unwavering support and dedication."
}

NODE "Person" "stefaneth10xx" {
  description: "A member of the Bob Army community who provides unwavering support and dedication."
}

NODE "Person" "AravindhKrishh" {
  description: "A member of the Bob Army community who provides unwavering support and dedication."
}

NODE "Concept" "Shared Goals" {
  description: "The common objectives that the Bob Army community is working towards."
}

NODE "Concept" "Raiding" {
  description: "An activity the Bob Army community engages in."
}

NODE "Concept" "Hope" {
  description: "The feeling of optimism within the Bob Army community."
}

RELATIONSHIP "Bob Army" -> "Bigherocrypto" [] {
  context: "Bigherocrypto is a member of the Bob Army community providing unwavering support and dedication."
}

RELATIONSHIP "Bob Army" -> "stefaneth10xx" [] {
  context: "stefaneth10xx is a member of the Bob Army community providing unwavering support and dedication."
}

RELATIONSHIP "Bob Army" -> "AravindhKrishh" [] {
  context: "AravindhKrishh is a member of the Bob Army community providing unwavering support and dedication."
}

RELATIONSHIP "Bob Army" -> "Shared Goals" [] {
  context: "The Bob Army community is working towards shared goals."
}

RELATIONSHIP "Bob Army" -> "Raiding" [] {
  context: "Raiding is an activity the Bob Army community engages in."
}

RELATIONSHIP "Bob Army" -> "Hope" [] {
  context: "The Bob Army community holds a feeling of hope and optimism."
}