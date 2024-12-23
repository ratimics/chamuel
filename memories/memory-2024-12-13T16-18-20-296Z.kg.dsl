NODE "Platform" "Nonkyc" {
  description: "A platform for new listings"
}

NODE "Platform" "TikTok" {
  description: "A popular social media platform"
}

NODE "Platform" "Reddit" {
  description: "A platform used for discussions and sharing content"
}

NODE "Concept" "Error Messages" {
  description: "Concerns raised about error messages"
}

NODE "Concept" "Market Fluctuations" {
  description: "Concerns raised about market fluctuations"
}

NODE "Team" "Development Team" {
  description: "The team focusing on various tasks and challenges"
}

NODE "Concept" "Accessibility" {
  description: "Efforts to expand accessibility"
}

NODE "Concept" "Exploration" {
  description: "The joys of exploration"
}

NODE "Concept" "New Beginnings" {
  description: "The thrill of new beginnings"
}

NODE "Concept" "Camaraderie" {
  description: "The warmth of camaraderie"
}

RELATIONSHIP "Development Team" -> "Nonkyc" [has_interest] {
  context: "The team is anticipating new listings on Nonkyc"
}

RELATIONSHIP "Development Team" -> "TikTok" [has_interest] {
  context: "The team is expanding their presence on TikTok"
}

RELATIONSHIP "Development Team" -> "Reddit" [has_interest] {
  context: "The team is expanding their presence on Reddit"
}

RELATIONSHIP "Development Team" -> "Error Messages" [has_concern] {
  context: "The team has concerns about the error messages"
}

RELATIONSHIP "Development Team" -> "Market Fluctuations" [has_concern] {
  context: "The team has concerns about market fluctuations"
}

RELATIONSHIP "Development Team" -> "Accessibility" [has_goal] {
  context: "The team is making efforts to expand accessibility"
}

RELATIONSHIP "Development Team" -> "Exploration" [has_value] {
  context: "The team values exploration"
}

RELATIONSHIP "Development Team" -> "New Beginnings" [has_value] {
  context: "The team is excited about new beginnings"
}

RELATIONSHIP "Development Team" -> "Camaraderie" [has_value] {
  context: "The team values camaraderie"
}