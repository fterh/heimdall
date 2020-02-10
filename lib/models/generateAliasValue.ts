// @ts-ignore
import randomWords from "random-words";

const NUM_WORDS = 4;

export default (): string => {
  console.log("Generating alias");

  const options = {
    exactly: 1,
    separator: "",
    wordsPerString: NUM_WORDS
  };

  return randomWords(options)[0];
};
