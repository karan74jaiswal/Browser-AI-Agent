import { interpolate } from "./interpolate"

export type LogicalCombinator = "and" | "or"

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "is_empty"
  | "is_not_empty"
  | "regex_match"
  | "not_regex_match"

export type ConditionCriterion = {
  id: string
  left: string
  operator: ConditionOperator
  right: string
}

/**
 * Compares two scalar strings according to the given operator.
 * Handles numeric coercion, boolean case normalization, substring containment, and regex.
 */
export function compareValues(
  left: string,
  operator: ConditionOperator,
  right: string
): boolean {
  const leftTrim = left.trim()
  const rightTrim = right.trim()

  switch (operator) {
    case "is_empty":
      return leftTrim === ""
    case "is_not_empty":
      return leftTrim !== ""
    case "equals": {
      // Check numeric equality (e.g. "100" == "100.00")
      const numLeft = Number(leftTrim)
      const numRight = Number(rightTrim)
      if (leftTrim !== "" && rightTrim !== "" && !isNaN(numLeft) && !isNaN(numRight)) {
        return numLeft === numRight
      }
      // Check boolean equality
      const lLower = leftTrim.toLowerCase()
      const rLower = rightTrim.toLowerCase()
      if ((lLower === "true" || lLower === "false") && (rLower === "true" || rLower === "false")) {
        return lLower === rLower
      }
      return leftTrim === rightTrim
    }
    case "not_equals": {
      return !compareValues(left, "equals", right)
    }
    case "contains": {
      return leftTrim.toLowerCase().includes(rightTrim.toLowerCase())
    }
    case "not_contains": {
      return !leftTrim.toLowerCase().includes(rightTrim.toLowerCase())
    }
    case "starts_with": {
      return leftTrim.toLowerCase().startsWith(rightTrim.toLowerCase())
    }
    case "ends_with": {
      return leftTrim.toLowerCase().endsWith(rightTrim.toLowerCase())
    }
    case "greater_than": {
      const numLeft = Number(leftTrim)
      const numRight = Number(rightTrim)
      if (!isNaN(numLeft) && !isNaN(numRight) && leftTrim !== "" && rightTrim !== "") {
        return numLeft > numRight
      }
      return leftTrim > rightTrim
    }
    case "less_than": {
      const numLeft = Number(leftTrim)
      const numRight = Number(rightTrim)
      if (!isNaN(numLeft) && !isNaN(numRight) && leftTrim !== "" && rightTrim !== "") {
        return numLeft < numRight
      }
      return leftTrim < rightTrim
    }
    case "greater_than_or_equal": {
      const numLeft = Number(leftTrim)
      const numRight = Number(rightTrim)
      if (!isNaN(numLeft) && !isNaN(numRight) && leftTrim !== "" && rightTrim !== "") {
        return numLeft >= numRight
      }
      return leftTrim >= rightTrim
    }
    case "less_than_or_equal": {
      const numLeft = Number(leftTrim)
      const numRight = Number(rightTrim)
      if (!isNaN(numLeft) && !isNaN(numRight) && leftTrim !== "" && rightTrim !== "") {
        return numLeft <= numRight
      }
      return leftTrim <= rightTrim
    }
    case "regex_match": {
      try {
        const regex = new RegExp(rightTrim, "i")
        return regex.test(leftTrim)
      } catch {
        return false
      }
    }
    case "not_regex_match": {
      try {
        const regex = new RegExp(rightTrim, "i")
        return !regex.test(leftTrim)
      } catch {
        return false
      }
    }
    default:
      return false
  }
}

/**
 * Evaluates an array of homogeneous condition criteria with short-circuiting.
 */
export function evaluateIfConditions(
  conditions: ConditionCriterion[],
  combinator: LogicalCombinator,
  context: Record<string, unknown>
): boolean {
  if (!conditions || conditions.length === 0) {
    return true
  }

  if (combinator === "and") {
    for (const criterion of conditions) {
      const leftVal = interpolate(criterion.left || "", context)
      const rightVal = interpolate(criterion.right || "", context)
      const matched = compareValues(leftVal, criterion.operator, rightVal)
      if (!matched) {
        return false // Short-circuit on first false
      }
    }
    return true
  }

  if (combinator === "or") {
    for (const criterion of conditions) {
      const leftVal = interpolate(criterion.left || "", context)
      const rightVal = interpolate(criterion.right || "", context)
      const matched = compareValues(leftVal, criterion.operator, rightVal)
      if (matched) {
        return true // Short-circuit on first true
      }
    }
    return false
  }

  return false
}
