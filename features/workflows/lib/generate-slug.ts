import { adjectives, animals, uniqueNamesGenerator } from "unique-names-generator"

/**
 * Generates a random hyphenated slug composed of an adjective and an animal.
 * Example: "brave-otter"
 */
export function generateSlug(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    length: 2,
    style: "lowerCase",
  })
}
