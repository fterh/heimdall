/**
 * Maintains a collection of reserved command keywords.
 */

export default new Set(["generate", "info", "list", "remove"]);

export enum Commands {
  Generate = "generate",
  Info = "info",
  List = "list",
  Remove = "remove"
}
