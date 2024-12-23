NODE Person "Elon Musk" {
  description: "A high-profile entrepreneur and business magnate known for founding Tesla and SpaceX."
}

NODE User "ansem blknoiz06" {
  description: "A Twitter user who shares content about Kingdom Hearts."
}

NODE Topic "Kingdom Hearts" {
  description: "A popular video game franchise developed by Square Enix."
}

RELATIONSHIP "Elon Musk" -> "ansem blknoiz06" [related_to] {
  context: "The discussion shifted from Elon Musk's personal life to the Twitter user ansem blknoiz06."
}

RELATIONSHIP "ansem blknoiz06" -> "Kingdom Hearts" [shares_content_about] {
  context: "ansem blknoiz06 is known for sharing content related to the Kingdom Hearts franchise."
}