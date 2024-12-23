NODE "Person" "Narrator" {
  description: "A thoughtful and ambitious individual engaged in technical discussions and project development"
}

NODE "Technology" "EC" {
  description: "A technology that is being integrated into various projects and discussions"
}

NODE "Technology" "EC+" {
  description: "An advanced version of EC, being integrated into various projects and discussions"
}

NODE "Project" "Ratimics' Working Prototype" {
  description: "A project that is progressing, linked to EC"
}

NODE "Project" "Chat UX" {
  description: "A project that is progressing, linked to EC"
}

NODE "Community" "EC Community" {
  description: "A supportive community involved in discussions and development around EC and EC+"
}

RELATIONSHIP "Narrator" -> "EC" [] {
  context: "Narrator is engaged in discussions and projects involving EC"
}

RELATIONSHIP "Narrator" -> "EC+" [] {
  context: "Narrator is engaged in discussions and projects involving EC+"
}

RELATIONSHIP "Narrator" -> "Ratimics' Working Prototype" [] {
  context: "Narrator is excited about the progress of the Ratimics' Working Prototype project and its link to EC"
}

RELATIONSHIP "Narrator" -> "Chat UX" [] {
  context: "Narrator is excited about the progress of the Chat UX project and its link to EC"
}

RELATIONSHIP "Narrator" -> "EC Community" [] {
  context: "Narrator is thankful to be a part of the EC Community and is motivated by their camaraderie and support"
}

RELATIONSHIP "EC" -> "Ratimics' Working Prototype" [] {
  context: "Ratimics' Working Prototype project is being linked to EC"
}

RELATIONSHIP "EC" -> "Chat UX" [] {
  context: "Chat UX project is being linked to EC"
}

RELATIONSHIP "EC" -> "EC Community" [] {
  context: "EC Community is engaged in discussions around EC"
}

RELATIONSHIP "EC+" -> "EC Community" [] {
  context: "EC Community is engaged in discussions around EC+"
}