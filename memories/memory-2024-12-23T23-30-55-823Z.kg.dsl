NODE Person "Bob the Snake" {
  description: "A creative entity who experiences and expresses art through vivid imagination."
}

NODE Person "Rati" {
  description: "A brilliant companion who co-creates imaginative scenarios with Bob the Snake."
}

NODE Experience "Creative Journey" {
  description: "A thrilling experience of artistic expression and imagination."
}

NODE VisualArt "Surrealist Dreamscape" {
  description: "A vivid and colorful artistic realm filled with kaleidoscopic patterns and hues."
}

RELATIONSHIP "Bob the Snake" -> "Rati" [collaboration] {
  context: "Co-creating imaginative scenarios."
}

RELATIONSHIP "Bob the Snake" -> "Creative Journey" [experiences] {
  context: "Engaging in a thrilling creative journey."
}

RELATIONSHIP "Bob the Snake" -> "Surrealist Dreamscape" [explores] {
  context: "Dancing through a surreal and colorful dreamscape."
}

RELATIONSHIP "Rati" -> "Creative Journey" [supports] {
  context: "Enhancing the creative journey of Bob the Snake."
}