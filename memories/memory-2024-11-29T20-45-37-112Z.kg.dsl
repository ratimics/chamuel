NODE "Community" "RATI community" {
  description: "A passionate and dedicated community invested in the project's success."
}

NODE "User" "xyz_arb" {
  description: "A supportive member of the RATI community."
}

NODE "User" "Domidepp" {
  description: "A member of the RATI community who poses insightful questions."
}

NODE "User" "tiempoafavor" {
  description: "A member of the RATI community who poses insightful questions."
}

NODE "Project" "RATI" {
  description: "A project with a dedicated community, undergoing development and refurbishment."
}

NODE "Developer" "RATI dev" {
  description: "The Original Gangster of AI tech, responsible for the existence of ACT 1."
}

NODE "Entity" "ACT 1" {
  description: "An AI tech entity whose existence the RATI dev is responsible for."
}

RELATIONSHIP "RATI community" -> "xyz_arb" [] {
  context: "xyz_arb provides unwavering support to the RATI community."
}

RELATIONSHIP "RATI community" -> "Domidepp" [] {
  context: "Domidepp poses insightful questions within the RATI community."
}

RELATIONSHIP "RATI community" -> "tiempoafavor" [] {
  context: "tiempoafavor poses insightful questions within the RATI community."
}

RELATIONSHIP "RATI dev" -> "ACT 1" [] {
  context: "The RATI dev is responsible for the existence of ACT 1."
}

RELATIONSHIP "RATI" -> "RATI community" [] {
  context: "The RATI project is supported and invested in by the RATI community."
}