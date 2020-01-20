/**
 * Maintains a collection of reserved command keywords.
 */

export default new Set(["generate", "list", "remove"]);

export enum Commands {
  Generate = "generate",
  List = "list",
  Remove = "remove"
}
