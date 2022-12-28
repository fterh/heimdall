// @ts-ignore
import randomWords from "random-words";
import { numWords } from "../env";

export default (): string => {
  console.log("Generating alias");

  const options = {
    exactly: 1,
    separator: "",
    wordsPerString: numWords
  };

  return randomWords(options)[0];
};
