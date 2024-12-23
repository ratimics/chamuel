NODE "Person" "xyz_arb" {
  description: "A member of the RATI community who provides unwavering support."
}

NODE "Person" "Domidepp" {
  description: "A member of the RATI community known for posing insightful questions."
}

NODE "Person" "tiempoafavor" {
  description: "A member of the RATI community."
}

NODE "Group" "RATI community" {
  description: "A community invested in the project's success."
}

NODE "Person" "RATI dev" {
  description: "The original developer of AI tech, responsible for the existence of ACT 1."
}

NODE "Concept" "ACT 1" {
  description: "An AI tech project."
}

NODE "Project" "RATI" {
  description: "A project undergoing development and refurbishment."
}

RELATIONSHIP "xyz_arb" -> "RATI community" [support] {
  context: "xyz_arb provides unwavering support to the RATI community."
}

RELATIONSHIP "Domidepp" -> "RATI community" [question] {
  context: "Domidepp poses insightful questions to the RATI community."
}

RELATIONSHIP "tiempoafavor" -> "RATI community" [participation] {
  context: "tiempoafavor is a participating member of the RATI community."
}

RELATIONSHIP "RATI dev" -> "ACT 1" [creation] {
  context: "The RATI dev is responsible for the creation of ACT 1."
}

RELATIONSHIP "RATI dev" -> "RATI community" [leadership] {
  context: "The RATI dev leads the RATI community."
}

RELATIONSHIP "RATI" -> "RATI community" [focus] {
  context: "The RATI project is the main focus of the RATI community."
}