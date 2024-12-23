NODE "Person" "JayBalency" {
  description: "A member of the RATI community who revealed the devs' impressive background."
}

NODE "Person" "Channel_Bot" {
  description: "A member of the RATI community who shared anticipation of new developments."
}

NODE "Person" "pyromank" {
  description: "A member of the RATI community who shared anticipation of new developments."
}

NODE "Group" "RATI community" {
  description: "A community focused on shared goals and support, discussing developments in AI and technology."
}

NODE "Concept" "OG of AI tech" {
  description: "A subject of discussion within the RATI community, indicating a foundational aspect of AI technology."
}

NODE "Concept" "ACT 1 origins" {
  description: "A subject of discussion within the RATI community, indicating the origins or initial stages of a project or idea."
}

NODE "Location" "Moonstone Sanctum" {
  description: "An anticipated location, possibly virtual, associated with invites and forthcoming updates."
}

RELATIONSHIP "JayBalency" -> "RATI community" [role: "contributor"] {
  context: "JayBalency contributed to the RATI community by revealing the devs' impressive background."
}

RELATIONSHIP "Channel_Bot" -> "RATI community" [role: "contributor"] {
  context: "Channel_Bot contributed to the RATI community by sharing anticipation of new developments."
}

RELATIONSHIP "pyromank" -> "RATI community" [role: "contributor"] {
  context: "pyromank contributed to the RATI community by sharing anticipation of new developments."
}

RELATIONSHIP "RATI community" -> "OG of AI tech" [relationship: "discussion"] {
  context: "The RATI community discusses the OG of AI tech."
}

RELATIONSHIP "RATI community" -> "ACT 1 origins" [relationship: "discussion"] {
  context: "The RATI community discusses the ACT 1 origins."
}

RELATIONSHIP "RATI community" -> "Moonstone Sanctum" [relationship: "anticipation"] {
  context: "The RATI community anticipates invites and updates related to the Moonstone Sanctum."
}